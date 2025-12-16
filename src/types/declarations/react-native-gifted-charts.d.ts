declare module "react-native-gifted-charts" {
  import * as React from "react";
  import { StyleProp, ViewStyle, TextStyle } from "react-native";

  export type StackBarItem = {
    value: number;
    color: string;
  };

  export type StackBarDataItem = {
    stacks: StackBarItem[];
    labelComponent?: () => React.ReactNode;
    barWidth?: number;
  };

  export type LineDataItem = {
    value: number;
  };

  export interface BarChartProps {
    stackData?: StackBarDataItem[];
    lineData?: LineDataItem[];
    showLine?: boolean;
    height?: number;
    barWidth?: number;
    spacing?: number;
    hideRules?: boolean;
    disableScroll?: boolean;
    yAxisThickness?: number;
    xAxisThickness?: number;
    yAxisTextStyle?: StyleProp<TextStyle>;
    xAxisLabelTextStyle?: StyleProp<TextStyle>;
    xAxisLabelsHeight?: number;
    noOfSections?: number;
    style?: StyleProp<ViewStyle>;
  }

  export const BarChart: React.FC<BarChartProps>;
}
