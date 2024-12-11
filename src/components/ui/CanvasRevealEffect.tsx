"use client";

import { cn } from "@/src/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef, useCallback } from "react";
import * as THREE from "three";

export const CanvasRevealEffect = ({
  animationSpeed = 0.4,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
}) => {
  return (
    <div className={cn("h-full relative bg-white w-full", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[0, 255, 255]]}
          dotSize={dotSize ?? 3}
          opacities={opacities}
          shader={`float animation_speed_factor = ${animationSpeed.toFixed(1)};
            float intro_offset = distance(u_resolution / 2.0 / u_total_size, st2) * 0.01 + (random(st2) * 0.15);
            opacity *= step(intro_offset, u_time * animation_speed_factor);
            opacity *= clamp((1.0 - step(intro_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);`}
          center={["x", "y"]}
        />
      </div>
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-[84%]" />
      )}
    </div>
  );
};

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
  center?: ("x" | "y")[];
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 4,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const getUniforms = useCallback(() => {
    let colorsArray: number[][] = new Array(6).fill(colors[0]);

    if (colors.length === 2) {
      colorsArray = [...colors.slice(0, 3), ...colors.slice(1)];
    } else if (colors.length === 3) {
      colorsArray = [
        colors[0],
        colors[1],
        colors[1],
        colors[2],
        colors[2],
        colors[0],
      ];
    }

    return {
      u_colors: {
        value: colorsArray.map((color: number[]) =>
          color.map((c: number) => c / 255)
        ),
        type: "uniform3fv",
      },
      u_opacities: {
        value: opacities,
        type: "uniform1fv",
      },
      u_total_size: {
        value: totalSize,
        type: "uniform1f",
      },
      u_dot_size: {
        value: dotSize,
        type: "uniform1f",
      },
    };
  }, [colors, opacities, totalSize, dotSize]);

  const uniforms = useMemo(() => getUniforms(), [getUniforms]);

  return (
    <Shader
      source={`precision mediump float;
        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        out vec4 fragColor;

        float random(vec2 xy) {
          return fract(sin(dot(xy.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec2 st = fragCoord / u_resolution;
          vec2 grid = floor(st * u_total_size);
          float rand = random(grid);
          float opacity = u_opacities[int(rand * 10.0)];
          vec3 color = u_colors[int(rand * 6.0)];
          fragColor = vec4(color, opacity);
        }`}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

interface ShaderProps {
  source: string;
  uniforms: { [key: string]: THREE.IUniform };
  maxFps?: number;
}

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full">
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  );
};

const ShaderMaterial: React.FC<{
  source: string;
  uniforms: { [key: string]: THREE.IUniform };
  maxFps?: number;
}> = ({ source, uniforms, maxFps = 60 }) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);
  const lastFrameTime = useRef(0);

  useFrame(({ clock }) => {
    if (!ref.current) return;

    const timestamp = clock.getElapsedTime();
    if (timestamp - lastFrameTime.current < 1 / maxFps) return;
    lastFrameTime.current = timestamp;

    (ref.current.material as THREE.ShaderMaterial).uniforms.u_time.value =
      timestamp;
  });

  const material = useMemo(() => {
    const preparedUniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(size.width, size.height) },
      ...uniforms,
    };

    return new THREE.ShaderMaterial({
      vertexShader: `precision mediump float;
        out vec2 fragCoord;
        void main() {
          fragCoord = position.xy;
          gl_Position = vec4(position, 1.0);
        }`,
      fragmentShader: source,
      uniforms: preparedUniforms,
    });
  }, [size, source, uniforms]);

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive attach="material" object={material} />
    </mesh>
  );
};
