import React from 'react';
import { EmployeePage } from '../EmployeePage';
import { NativePage } from '../../components/native-antd/NativePage';

const EmployeePageNativeWrapper: React.FC = () => (
  <NativePage outlineDensity="minimal" disablePolish>
    <EmployeePage />
  </NativePage>
);

export default EmployeePageNativeWrapper;
