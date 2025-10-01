import React from "react";
import { Slider } from "antd";

// 定义单值滑块和范围滑块的联合类型
export type SliderAdapterProps = React.ComponentProps<typeof Slider>;
export type RangeSliderAdapterProps = React.ComponentProps<typeof Slider> & {
  range: true;
  value?: number[];
  defaultValue?: number[];
  onChange?: (value: number[]) => void;
  onAfterChange?: (value: number[]) => void;
};

/**
 * Slider 单值滑块适配器
 */
export const SliderAdapter: React.FC<SliderAdapterProps> = (props) => {
  return <Slider {...props} />;
};

/**
 * RangeSlider 范围滑块适配器
 */
export const RangeSliderAdapter: React.FC<RangeSliderAdapterProps> = (props) => {
  return <Slider {...props} />;
};

export default SliderAdapter;