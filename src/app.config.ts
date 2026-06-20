export default defineAppConfig({
  pages: [
    'pages/profile/index',
    'pages/records/index',
    'pages/recheck/index',
    'pages/clinic/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#10B981',
    navigationBarTitleText: '窝沟封闭助手',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F0FDF4'
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#10B981',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/profile/index',
        text: '孩子档案'
      },
      {
        pagePath: 'pages/records/index',
        text: '封闭记录'
      },
      {
        pagePath: 'pages/recheck/index',
        text: '复查打卡'
      }
    ]
  }
})
