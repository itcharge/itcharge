> 这篇文章通过一步步指导，教你彻底学会「iOS 应用间相互跳转」问题。文末有 Github 的学习 Demo。

<!--more-->

## 1. 应用间相互跳转简介

在 iOS 开发的过程中，我们经常会遇到需要从一个应用程序 A 跳转到另一个应用程序 B 的场景。这就需要我们掌握 iOS 应用程序之间的相互跳转知识。

下面来看看我们在开发过程中遇到的应用场景。

## 2. 应用间相互跳转应用场景

1. 使用第三方用户登录，跳转到需授权的 App。如 QQ 登录，微信登录等。
   - 需要用户授权，还需要"返回到调用的程序，同时返回授权的用户名、密码"。
2. 应用程序推广，跳转到另一个应用程序（本机已经安装），或者跳转到 iTunes 并显示应用程序下载页面（本机没有安装）。
3. 第三方支付，跳转到第三方支付 App，如支付宝支付，微信支付。
4. 内容分享，跳转到分享 App 的对应页面，如分享给微信好友、分享给微信朋友圈、分享到微博。
5. 显示位置、地图导航，跳转到地图应用。
6. 使用系统内置程序，跳转到打电话、发短信、发邮件、Safari 打开网页等内置 App 中。

那么我们如何实现应用间的相互跳转呢？先来看下原理。

## 3. 应用间相互跳转实现原理

在 iOS 中打开一个应用程序只需要拿到这个应用程序的协议头即可，所以我们只需配置应用程序的协议头即可。

假设有**应用 A**和**应用 B**两个应用，现在需要从应用 A 跳转到应用 B 中。

- 原理：通过设置跳转到应用 B 的 URL Schemes（自定义的协议头），应用 B 将其自身“绑定”到一个自定义 URL Schemes 上，就可以从应用 A 中利用应用 B 的 URL Schemes 启动应用 B 了。

具体怎么做呢，下面一步步来教你，先来个简单点的：从应用 A 跳转到应用 B。

## 4. 应用 A 跳转到应用 B

1. 首先我们用 Xcode 创建两个 iOS 应用程序项目，项目名称分别为 App-A、App-B。

2. 选择项目 App-B -> TARGETS -> Info -> URL Types -> URL Schemes，设置 App-B 的 URL Schemes 为 AppB。
   ![](http://qcdn.itcharge.cn/images/20210729104531.png)

3. 在应用程序 App-A 中添加一个用来点击跳转的 Button，并监听点击事件，添加跳转代码。

   ![](http://qcdn.itcharge.cn/images/iOS-Application-jump-001.png)

   ```objc
   - (IBAction)jumpToAppB:(id)sender {
       // 1.获取应用程序App-B的URL Scheme
       NSURL *appBUrl = [NSURL URLWithString:@"AppB://"];

       // 2.判断手机中是否安装了对应程序
       if ([[UIApplication sharedApplication] canOpenURL:appBUrl]) {
           // 3. 打开应用程序App-B
           [[UIApplication sharedApplication] openURL:appBUrl];
       } else {
           NSLog(@"没有安装");
       }
   }
   ```

4. 如果是 iOS9 之前的模拟器或是真机，那么在相同的模拟器中先后运行 App-B、App-A，点击按钮，就可以实现跳转了。

5. 如果是 iOS9 之后的模拟器或是真机，那么则需要再在应用程序 App-A 中将 App-B 的 URL Schemes 添加到白名单中，原因和做法如下。

   - iOS9 引入了白名单的概念。
   - 在 iOS9 中，如果使用 `canOpenURL: `方法，该方法所涉及到的 URL Schemes 必须在"Info.plist"中将它们列为白名单，否则不能使用。key 叫做 LSApplicationQueriesSchemes ，键值内容是对应应用程序的 URL Schemes。

具体做法就是在 App-A 的 Info 文件中，添加 LSApplicationQueriesSchemes 数组，然后添加键值为 AppB 的字符串。

![](http://qcdn.itcharge.cn/images/iOS-Application-jump-002.png)

添加白名单之后在相同的模拟器中先后运行 App-B、App-A，点击按钮，就可以实现跳转了。

具体效果如下图所示。

![](http://qcdn.itcharge.cn/images/iOS-Application-jump-003.gif)

下边学习以下从应用 A 跳转到应用 B 的特定界面。

## 5. 应用 A 跳转到应用 B 的特定界面

很多时候，我们做应用程序之间的跳转并不只是跳转到其他程序就可以了，而是要跳转到其他程序的特定页面上。比如我们在浏览网页时，会有分享到微信朋友圈或是分享给微信朋友，这就需要跳转到微信朋友圈界面或是微信朋友选择界面。

具体如何做呢？

1. 首先我们先来为 App-B 搭建两个页面`Page1`和`Page2`。这里用导航控制器 Push 两个 ViewController，通过 Storyboard Segue 设置两个 ViewController 的标识符绑定，分别为"homeToPage1"和"homeToPage2"。

   ![](http://qcdn.itcharge.cn/images/iOS-Application-jump-004.png)

   ![](http://qcdn.itcharge.cn/images/iOS-Application-jump-005.png)

2. 在应用程序 App-A 中添加两个用来点击跳转的 Button，一个跳转到 Page1，一个跳转到 Page2，并监听点击事件，添加跳转代码。

![](http://qcdn.itcharge.cn/images/iOS-Application-jump-006.png)

```objc
- (IBAction)jumpToAppBPage1:(id)sender {
    // 1.获取应用程序App-B的Page1页面的URL
    NSURL *appBUrl = [NSURL URLWithString:@"AppB://Page1"];

    // 2.判断手机中是否安装了对应程序
    if ([[UIApplication sharedApplication] canOpenURL:appBUrl]) {
        // 3. 打开应用程序App-B的Page1页面
        [[UIApplication sharedApplication] openURL:appBUrl];
    } else {
        NSLog(@"没有安装");
    }
}

- (IBAction)jumpToAppBPage2:(id)sender {
    // 1.获取应用程序App-B的Page2页面的URL
    NSURL *appBUrl = [NSURL URLWithString:@"AppB://Page2"];

    // 2.判断手机中是否安装了对应程序
    if ([[UIApplication sharedApplication] canOpenURL:appBUrl]) {
        // 3. 打开应用程序App-B的Page2页面
        [[UIApplication sharedApplication] openURL:appBUrl];
    } else {
        NSLog(@"没有安装");
    }
}
```

3.在应用 App-B 中通过`AppDelegate`监听跳转，进行判断，执行不同页面的跳转

```objc
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
    // 1.获取导航栏控制器
    UINavigationController *rootNav = (UINavigationController *)self.window.rootViewController;
    // 2.获得主控制器
    ViewController *mainVc = [rootNav.childViewControllers firstObject];

    // 3.每次跳转前必须是在跟控制器(细节)
    [rootNav popToRootViewControllerAnimated:NO];

    // 4.根据字符串关键字来跳转到不同页面
    if ([url.absoluteString containsString:@"Page1"]) { // 跳转到应用App-B的Page1页面
        // 根据segue标示进行跳转
        [mainVc performSegueWithIdentifier:@"homeToPage1" sender:nil];
    } else if ([url.absoluteString containsString:@"Page2"]) { // 跳转到应用App-B的Page2页面
        // 根据segue标示进行跳转
        [mainVc performSegueWithIdentifier:@"homeToPage2" sender:nil];
    }

    return YES;
}
```

具体效果如下：

![](http://qcdn.itcharge.cn/images/iOS-Application-jump-007.gif)

## 6.从应用 B 跳转回应用 A

### 1. 步骤分析：

1. 我们想要从应用 B 再跳转回应用 A，那么在跳转到应用 B 的时候，还应将应用 A 的 URL Schemes 传递过来。这样我们才能判断应该跳转回哪个应用程序。
   - 这样我们指定一个传递 URL 的规则：`协议头://应用B的URL Schemes?应用A的URL Schemes`。即：`AppB://Page1?AppA`。
   - 说明：
     - AppB 是跳转过来的应用 App-B 的 URL Schemes；
     - Page1 是用来区别跳转页面的标识；
     - ? 是分割符；
     - AppA 是跳转回的应用 App-A 的 URL Schemes
2. 我们根据传递来的数据，进行反跳回去。
   1. 之前我们在应用 App-B 中通过`AppDelegate`执行不同页面的跳转。在对应方法中我们可以拿到完整的 URL，在主控制器 ViewController 中设定一个属性，将该 URL 保存在主控制器中。
   2. 在主控制器中我们可以通过`- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender;`方法获取将要跳转的页面控制器。
   3. 在将要跳转的页面控制器中定义一个属性，用于接受、截取出跳转回的应用（即 App-A）的 URL Schemes，执行跳转。

### 2. 具体步骤：

###### 1. 准备步骤：

1. 因为我们想要跳转回应用 A，首先我们要先设置应用 App-A 的 URL Schemes，将其设置为 AppA。同时在应用 App-B 中添加白名单。具体操作和之前相似。
2. 在 App-B 项目中的 Page1 和 Page2 两个页面各添加一个 Button，用于跳转回 App-A。同时添加 Page1 和 Page2 的页面控制器 Page1ViewController 和 Page2ViewController。
   ![](http://qcdn.itcharge.cn/images/iOS-Application-jump-008.png)

###### 2. 实现步骤

1. 在 App-A 中修改传递的 URL。

   - 分别修改为：`@"AppB://?AppA"`、`@"AppB://Page1?AppA"`、`@"AppB://Page2?AppA"`

2. 在 App-B 的主控制器 ViewController 中增加一条属性`@property (nonatomic, copy) NSString *urlString;`，并在 App-B 中通过`AppDelegate`中保存完整的 URL。

3. 在将要跳转的页面控制器 Page1ViewController 和 Page2ViewController 中定义一个属性`@property (nonatomic, copy) NSString *urlString;`，用于接受、截取出跳转回的应用（即 App-A）的 URL Schemes，执行跳转。

4. 重写 App-B 的主控制器的`- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender`方法。

   ```objc
   - (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender
   {
       if ([segue.identifier isEqualToString:@"homeToPage1"]) {
           // 获得将要跳转的界面Page1的控制器
           Page1ViewController *Page1Vc = segue.destinationViewController;
           // 保存完整的App-A的URL给跳转界面Page1
           Page1Vc.urlString = self.urlString;
       } else if ([segue.identifier isEqualToString:@"homeToPage2"]) {
           // 获得将要跳转的界面Page2的控制器
           Page2ViewController *Page2Vc = segue.destinationViewController;
           // 保存完整的App-A的URL给跳转界面Page1
           Page2Vc.urlString = self.urlString;
       }
   }
   ```

5. 在对应界面控制器 Page1ViewController 和 Page2ViewController 中实现跳转代码
   **- Page1ViewController.m**

   ```objc
   - (IBAction)page1BackToAppA:(id)sender {
       // 1.拿到对应应用程序的URL Scheme
       NSString *urlSchemeString = [[self.urlString componentsSeparatedByString:@"?"] lastObject];
       NSString *urlString = [urlSchemeString stringByAppendingString:@"://"];

       // 2.获取对应应用程序的URL
       NSURL *url = [NSURL URLWithString:urlString];

       // 3.判断是否可以打开
       if ([[UIApplication sharedApplication] canOpenURL:url]) {
           [[UIApplication sharedApplication] openURL:url];
       }
   }
   ```

   **- Page2ViewController.m**

   ```objc
   - (IBAction)page2BackToAppA:(id)sender {
       // 1.拿到对应应用程序的URL Scheme
       NSString *urlSchemeString = [[self.urlString componentsSeparatedByString:@"?"] lastObject];
       NSString *urlString = [urlSchemeString stringByAppendingString:@"://"];

       // 2.获取对应应用程序的URL
       NSURL *url = [NSURL URLWithString:urlString];

       // 3.判断是否可以打开
       if ([[UIApplication sharedApplication] canOpenURL:url]) {
           [[UIApplication sharedApplication] openURL:url];
       }
   }
   ```

具体效果如下：

![](http://qcdn.itcharge.cn/images/iOS-Application-jump-009.gif)

还不太明白可参考下我的 Github 上 Demo 地址：[YSC-AppAJumpToAppB](https://github.com/tcharge/YSC-AppAJumpToAppB)。
