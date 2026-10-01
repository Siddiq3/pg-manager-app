import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { motion, useReducedMotion } from './ui';

const AnimatedPressable=Animated.createAnimatedComponent(Pressable);
const buzz=(kind)=>{try{const style=kind==='press'?Haptics.ImpactFeedbackStyle.Medium:Haptics.ImpactFeedbackStyle.Light;Haptics.impactAsync(style).catch(()=>{});}catch{}};

export function Press({children,onPress,disabled,style,haptics='tap',scaleTo=.975,...rest}){
 const p=useSharedValue(0);const reduced=useReducedMotion();
 const animated=useAnimatedStyle(()=>({transform:[{scale:reduced?1:1-(1-scaleTo)*p.value}]}));
 return <AnimatedPressable {...rest} disabled={disabled} onPress={onPress} onPressIn={()=>{p.value=withTiming(1,{duration:motion.fast});if(!disabled&&haptics)buzz(haptics)}} onPressOut={()=>{p.value=withTiming(0,{duration:motion.fast})}} style={[style,animated,disabled&&{opacity:.45}]}>{children}</AnimatedPressable>
}
export function FadeIn({children,delay=0,style}){const v=useSharedValue(0);const reduced=useReducedMotion();useEffect(()=>{v.value=withTiming(1,{duration:reduced?0:motion.base});},[reduced,v]);const a=useAnimatedStyle(()=>({opacity:v.value,transform:[{translateY:reduced?0:(1-v.value)*8}]}));return <Animated.View style={[style,a]}>{children}</Animated.View>}
export {Animated};