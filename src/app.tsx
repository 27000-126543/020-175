import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { useAppStore } from '@/store';

function App(props) {
  const initFromStorage = useAppStore((s) => s.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useDidShow(() => {
    initFromStorage();
  });

  useDidHide(() => {});

  return props.children;
}

export default App;
