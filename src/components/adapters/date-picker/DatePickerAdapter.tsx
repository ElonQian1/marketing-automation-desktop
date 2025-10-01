import React from "react";
import { DatePicker } from "antd";
import type { DatePickerProps, RangePickerProps } from "antd/es/date-picker";

type Size = "small" | "middle" | "large";

export interface DatePickerAdapterProps extends DatePickerProps {
  /** 统一尺寸，默认 middle */
  size?: Size;
}

export const DatePickerAdapter: React.FC<DatePickerAdapterProps> = ({ size = "middle", allowClear = true, ...rest }) => {
  return <DatePicker size={size} allowClear={allowClear} {...rest} />;
};

export interface RangeDatePickerAdapterProps extends RangePickerProps {
  size?: Size;
}

export const RangeDatePickerAdapter: React.FC<RangeDatePickerAdapterProps> = ({ size = "middle", allowClear = true, ...rest }) => {
  return <DatePicker.RangePicker size={size} allowClear={allowClear} {...rest} />;
};

export default DatePickerAdapter;
