import { RouteConfig } from 'react-router-config';
import HomePage from '../pages/homePage';
import AboutView from '@/pages/About';
// 导入页面组件

const routes: RouteConfig[] = [
  {
    path: '/',
    exact: true,
    component: HomePage,
    // 可选的其他配置
    meta: {
      title: 'Home',
      description: 'Welcome to the home page',
    },
  },
  {
    path: 'about',
    component: AboutView,
  },
];

export default routes;
