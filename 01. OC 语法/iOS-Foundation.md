---
title: OC 知识：Foundation 框架及相关类详尽总结
date: 2016-08-07 10:30:37
tags:
    - 技术
    - iOS 开发
categories:
    - 00 - 技术 - iOS 开发
---

> 本文用来介绍 Foundation 框架的相关知识，以及 Foundation 框架所提供类的相关知识总结。



<!--more-->



## 1. 框架介绍
框架是由很多类、方法、函数和文档按照一定的逻辑组织起来的集合，以使开发程序变得更加容易。在OS X系统下有100多个框架，这些框架可以用来开发应用程序。

## 2. Foundation框架介绍
Foundation框架是一个由上百个函数和类所构成的集合，它为Cocoa应用程序定义了一个基本功能层。不仅如此，Foundation框架还提供了一些范例，定义了一致性的约定，包括内存管理及对象集的访问。这些约定使用同样的机制处理不同类型的对象，令开发者编程时更有效更高效。

- Foundation框架中的类都是以NS为前缀的
- Foundation框架前缀NS的由来
    - 乔布斯于1976年创立苹果公司
    - 乔布斯于1985年离开苹果公司，创立NeXT公司，开发了Next Step操作系统
    - 在开发Next Step操作系统过程中产生了Foundation框架
    - 1997年，苹果公司收购NeXT公司，乔布斯重返苹果公司（Mac系统就是基于Next Step系统）
    - 2007年，苹果公司发布了iOS系统（iOS系统基于Mac系统）
    - "NS"其实指的是乔布斯创建的NeXT这个公司。

## 3. Foundation框架中的类
- Foundation框架包括：根对象类（NSObject）、表示基本数据类型的类（如字符串和字节数组）、存储其他对象的集合类、表述系统信息和集合的类。
- 根对象类（NSObject及NSCopying协议一起）定义了基本的对象属性和行为。
- Foundation框架提供了很多基本类型，包括数字（NSNumber）和字符串（NSString）。还提供了一些表述其他对象的类，如数组（NSArray）和字典集合（NSDictionary）类。
- Foundation框架提供了访问核心操作的类，如锁、线程和计时器。这些服务共同配合，为应用程序营造了一个健壮的环境。
- Foundation提供了管理对象的功能，可以在分布环境中创建，销毁，保存及共享对象。

## 4. 我们如何使用Foundation框架
可以使用 `#import<Foundation/Foundation.h>` 导入Foundation框架，因为Foundation.h文件实际上导入其他所有Foundation框架中的头文件

## 5. Foundation框架相关类总结

###### 下边是对Foundation框架中一些类的相关知识详细总结

- 字符串类：
    - NSString和NSMutableString：不可变字符串和可变字符串
    - [Foundation框架之字符串类总结](https://www.jianshu.com/p/17f6eb708998)
- 数组类：
    - NSArray和NSMutableArray：不可变字节数组和可变字节数组
    - [Foundation框架之数组类总结](https://www.jianshu.com/p/390a07d99c46)
- 字典类：
    - NSDicitonary和NSMutableDictnary：不可变字典和可变字典
    - [Foundation框架之字典类总结](https://www.jianshu.com/p/6bb97c1cd959)
- 数字类：
    - NSNumber：数字对象
    - [Foundation框架之数字、结构体、日期、文件类总结](https://www.jianshu.com/p/067d3b42e1da)
- 结构体类：
    - CGPoint：定义矩形原点坐标
    - CGSize：定义矩形尺寸的结构体
    - CGRect：同时定义矩形原点和尺寸的结构体
    - NSRange：描述位置和大小范围的结构体
    - NSValue：将结构体转换为对象的类
    - [Foundation框架之数字、结构体、日期、文件类总结](https://www.jianshu.com/p/067d3b42e1da)
- 日期类：
    - NSDate和NSCalendar：表示时间和日期的类
    - [Foundation框架之数字、结构体、日期、文件类总结](https://www.jianshu.com/p/067d3b42e1da)
- 文件类：
    - NSFileManager：管理文件系统的类
    - [Foundation框架之数字、结构体、日期、文件类总结](https://www.jianshu.com/p/067d3b42e1da)
