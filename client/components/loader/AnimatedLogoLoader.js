// components/AnimatedLogoLoader.js
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
  withDelay,
} from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function AnimatedLogoLoader() {
  // Separate animations for each path
  const pathOffsets = [
    useSharedValue(500),  // First path
    useSharedValue(500),  // Second path
  ];

  useEffect(() => {
    // Animate paths sequentially
    pathOffsets.forEach((offset, index) => {
        // withDelay
      offset.value = withRepeat(
        withDelay(

            index * 300, // Stagger animations
            withTiming(0, {
                duration: 1000,
                easing: Easing.inOut(Easing.ease),
            })
        ),
        -1, // loop infinitely
        true // reverse direction
    );
    });
  }, []);

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={200} height={200} viewBox="0 0 1000 500">
        {/* First path - Blue (#00aff0) */}
        <AnimatedPath
          d="M711 216.6 l0 -209.6 37 0 37 0 0.2 169.8 0.3 169.7 37.5 -35.4 c20.6 -19.5 40.1 -37.9 43.2 -40.9 l5.7 -5.5 2 2.4 c1.1 1.3 2 2.7 2.1 3.1 0 0.7 -161.5 153.8 -163.8 155.2 -0.9 0.6 -1.2 -44.7 -1.2 -208.8z m44.8 157.9 l22.2 -21 0 -169.7 0 -169.8 -29.5 0 -29.5 0 0 197.6 0 197.7 7.3 -6.9 c4 -3.8 17.3 -16.3 29.5 -27.9z"
          fill="none"
          stroke="#00aff0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="500"
          strokeDashoffset={pathOffsets[0]}
        />

        {/* Second path - Dark Blue (#002060) */}
        <AnimatedPath
          d="M919.7 395.8 c-0.4 -19.4 -0.7 -48.2 -0.7 -64 l0 -28.8 4 0 4 0 0 60 0 60 27.5 0 27.5 0 0 -72.2 c0 -70.6 -0.1 -72.4 -2.1 -76.8 -1.5 -3.3 -10.6 -13.2 -34.3 -37 -21.1 -21.2 -33.2 -34.1 -34.7 -37 -1.7 -3.3 -2.3 -6.2 -2.4 -11 0 -10.7 1.8 -13 40.1 -51.1 l33.9 -33.8 0.3 -42.1 c0.2 -23.1 -0.1 -42 -0.5 -42 -0.4 0.1 -33.9 33 -74.5 73.3 -69.6 69.2 -73.8 73.6 -77 80.2 -2.9 6.2 -3.3 7.9 -3.3 15.5 0 13.6 1.9 16.7 29.1 47.1 12.6 14 23.6 26.3 24.4 27.3 1.3 1.7 1.1 2.2 -3 5.8 l-4.5 3.8 -2.3 -2.6 c-2.1 -2.4 -2.2 -2.8 -0.7 -4.4 1.5 -1.7 0.5 -3 -16.2 -21.7 -9.8 -10.9 -19.9 -22.1 -22.4 -25 -9.1 -10.3 -13.8 -24.3 -11.9 -36 0.5 -3.1 2.5 -9.1 4.5 -13.2 3.4 -7.5 4.7 -8.8 84.2 -87.8 l80.8 -80.3 0.3 52.2 0.2 52.2 -35.4 35.6 c-19.5 19.5 -36.1 36.9 -37 38.7 -2.1 4.1 -2 11.5 0.1 16.1 1 2.2 14.3 16.5 33.4 35.7 17.5 17.6 32.5 32.9 33.4 34 0.8 1.1 2.4 4.9 3.5 8.4 1.9 6.1 2 8.9 2 81.2 l0 74.9 -34.8 0 -34.9 0 -0.6 -35.2z"
          fill="none"
          stroke="#002060"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="500"
          strokeDashoffset={pathOffsets[1]}
        />
      </Svg>
    </View>
  );
}
