---
pageLayout: home
pageClass: itcharge-home
permalink: /
comments: false
description: ITCharge 的技术博客，分享 AI Agent 开发、iOS/macOS 开发、服务器技术与生活随笔
signDown: true
config:
  - type: home-banner
    full: true
    banner: /home-bg.webp
    hero:
      name: ITCharge
      tagline: 高效率编程，慢节奏生活
      actions:
        - text: 进入博客
          link: "#home-features"
          theme: brand
        - text: 关于我
          link: /about/
          theme: alt
        - text: Github
          link: https://github.com/itcharge
          target: _blank
          rel: noopener noreferrer
          theme: alt
  - type: features
    title: 探索内容
    description: 以 Agent 工程实践为主，兼顾 iOS / macOS 开发、服务器技术与生活随笔
    features:
      - icon: 🤖
        title: Agent 开发
        details: 多 Agent 协作、工具调用、工作流编排
        link: /blogs/
      - icon: 📱
        title: iOS 开发
        details: Runtime、Crash 防护、多线程
        link: /blogs/categories/?id=5da0c1
      - icon: 🐳
        title: 服务器端
        details: Docker、Kubernetes 实践
        link: /blogs/categories/?id=14bb1b
      - icon: 📖
        title: 生活随笔
        details: 阅读、旅行、年度总结
        link: /blogs/categories/?id=e155e1
  - type: posts
    collection: blogs
---
