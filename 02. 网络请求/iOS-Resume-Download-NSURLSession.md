---
title: iOS 网络：『文件下载、断点下载』的实现（二）：NSURLSession
date: 2017-01-20 16:42:37
tags:
    - 技术
    - iOS 开发
categories:
    - 00 - 技术 - iOS 开发
---

> 目录
> 1. NSURLSession下载简介
> 2. NSURLSession下载相关
> 2.1 NSURLSession（block方法）
> 2.2 NSURLSession（代理方法）
> 2.3 NSURLSession（断点下载 | 不支持离线）
> 2.4 NSURLSession（断点下载 | 支持离线）

<!--more-->



关于『文件下载、断点下载』所有实现的Demo地址：[Demo地址](https://github.com/bujige/YSC-DownloadDemo)

iOS网络--『文件下载、断点下载』的实现相关文章：
- [iOS网络--『文件下载、断点下载』的实现（一）：NSURLConnection](https://www.bujige.net/blog/iOS-Resume-Download-NSURLConnection.html)
- [iOS网络--『文件下载、断点下载』的实现（二）：NSURLSession](https://www.bujige.net/blog/iOS-Resume-Download-NSURLSession.html)
- [iOS网络--『文件下载、断点下载』的实现（三）：AFNetworking](https://www.bujige.net/blog/iOS-Resume-Download-AFNetworking.html)

# 1. NSURLSession下载简介

iOS 7之后，苹果对Foundation URL 加载系统的彻底重构。在 2013 的 WWDC 上，苹果推出了 NSURLConnection 的继任者：NSURLSession。相比于NSURLConnection来说，使用NSURLSession下载就要简单多了，我们不需要分别考虑大小文件，只需要考虑使用不同的方法实现相应的功能即可。

NSURLSession提供了两种下载方式，一种是block方法，一种是通过NSURLSessionDownloadDelegate的代理方法实现下载。

# 2. NSURLSession下载相关

## 2.1 NSURLSession（block方法）

![NSURLSession（block方法）下载效果.gif](http://qncdn.bujige.net/images/iOS-Resume-Download-NSURLSession-001.gif)


NSURLSession的block使用方法如下：
1. 先创建一个NSURLSession类。
2. 再创建一个下载任务类NSURLSessionDownloadTask类，将session加入到下载任务中。
3. 开启下载任务。

其中，开启下载任务后，NSURLSessionDownloadTask默认就会将数据一点点写入本地沙盒的临时文件（tmp）中。这些原本需要我们自己做的任务苹果默认都帮助我们做好了。

但是，由于NSURLSessionDownloadTask写入的是本地沙盒的临时文件中，所以我们需要在临时文件下载之后，即在NSURLSessionDownloadTask的completionHandler这个block中，将临时文件剪切到一个永久的文件地址保存起来。

具体代码如下：

```objc
// 创建下载路径
NSURL *url = [NSURL URLWithString:@"https://bmob-cdn-8782.b0.upaiyun.com/2017/01/17/c6b6bb1640e9ae9e80b221c454c4e90d.jpg"];

// 创建NSURLRequest请求
NSURLRequest *request = [NSURLRequest requestWithURL:url];

// 创建NSURLSession对象
NSURLSession *session = [NSURLSession sharedSession];

// 创建下载任务,其中location为下载的临时文件路径
NSURLSessionDownloadTask *downloadTask = [session downloadTaskWithURL:url completionHandler:^(NSURL *location, NSURLResponse *response, NSError *error) {

    // 文件将要移动到的指定目录
    NSString *documentsPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];

    // 新文件路径
    NSString *newFilePath = [documentsPath stringByAppendingPathComponent:response.suggestedFilename]; 

    // 移动文件到新路径
    [[NSFileManager defaultManager] moveItemAtPath:location.path toPath:newFilePath error:nil];
}];

// 开始下载任务
[downloadTask resume];
```
这样虽然实现了文件下载，但是却无法监听下载进度。


## 2.2 NSURLSession（代理方法）

![NSURLSession（代理方法）下载效果.gif](http://qncdn.bujige.net/images/iOS-Resume-Download-NSURLSession-002.gif)

如果想要监听下载进度，我们就需要用到NSURLSessionDownloadDelegate。

具体使用方式就是使用代理的方法创建下载任务，并且实现对应的代理方法。

具体实现代码如下：

```objc
// 创建下载路径
NSURL *url = [NSURL URLWithString:@"https://dldir1.qq.com/qqfile/QQforMac/QQ_V5.4.0.dmg"];
    
// 创建NSURLSession对象，并设计代理方法。其中NSURLSessionConfiguration为默认配置
NSURLSession *session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration] delegate:self delegateQueue:[NSOperationQueue mainQueue]];
    
// 创建任务
NSURLSessionDownloadTask *downloadTask = [session downloadTaskWithURL:url];
    
// 开始任务
[downloadTask resume];
```

这里使用到了代理，所以我们要实现NSURLSessionDownloadDelegate的相关方法。主要用到以下几个方法。

```objc
#pragma mark <NSURLSessionDownloadDelegate> 实现方法
/**
 *  文件下载完毕时调用
 */
- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask
didFinishDownloadingToURL:(NSURL *)location
{
    // 文件将要移动到的指定目录
    NSString *documentsPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) firstObject];
    
    // 新文件路径
    NSString *newFilePath = [documentsPath stringByAppendingPathComponent:@"QQ_V5.4.0.dmg"];
    
    NSLog(@"File downloaded to: %@",newFilePath);
    
    // 移动文件到新路径
    [[NSFileManager defaultManager] moveItemAtPath:location.path toPath:newFilePath error:nil];
    
}

/**
 *  每次写入数据到临时文件时，就会调用一次这个方法。可在这里获得下载进度
 *
 *  @param bytesWritten              这次写入的文件大小
 *  @param totalBytesWritten         已经写入沙盒的文件大小
 *  @param totalBytesExpectedToWrite 文件总大小
 */
- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask
      didWriteData:(int64_t)bytesWritten
 totalBytesWritten:(int64_t)totalBytesWritten
totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite
{
    
    // 下载进度
    self.progressView.progress = 1.0 * totalBytesWritten / totalBytesExpectedToWrite;
    self.progressLabel.text = [NSString stringWithFormat:@"当前下载进度:%.2f%%",100.0 * totalBytesWritten / totalBytesExpectedToWrite];
}

/**
 *  恢复下载后调用
 */
- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask
 didResumeAtOffset:(int64_t)fileOffset
expectedTotalBytes:(int64_t)expectedTotalBytes
{
    
}
```

## 2.3 NSURLSession（断点下载 | 不支持离线）


![NSURLSession（断点下载 | 不支持离线）下载效果.gif](https://upload-images.jianshu.io/upload_images/1877784-d89e736333f69439.gif?imageMogr2/auto-orient/strip)


NSURLSession拥有终止下载的方法：`- (void)cancelByProducingResumeData:(void (^)(NSData *resumeData))completionHandler;`。

其中的参数resumeData包含了此次下载文件的请求路径，以及下载文件的位置信息。

而且NSURLSession还有一个方法`- (NSURLSessionDownloadTask *)downloadTaskWithResumeData:(NSData *)resumeData;`，可以利用上次停止下载的resumeData，开启一个新的任务继续下载。

因为涉及保存上次下载的resumeData，所以我们要将resumeData保存为全局变量，以便使用。另外还有一些其他类需要保存为全局变量。

但是使用这样的方法进行断点下载，如果程序被杀死，再重新启动的话，是无法继续下载的。只能重新开始下载。也就是说不支持离线下载。



NSURLSession断点下载（不支持离线）实现断点下载的步骤如下：

- 在实现断点下载的[开始/暂停]按钮中添加以下步骤：
    1. 设置一个downloadTask、session以及resumeData的全局变量
    2. 如果开始下载，就创建一个新的downloadTask，并启动下载
    3. 如果暂停下载，调用取消下载的函数，并在block中保存本次的resumeData到全局resumeData中。
    4. 如果恢复下载，将上次保存的resumeData加入到任务中，并启动下载。

具体实现过程如下：

- 定义下载文件需要用到的类和要实现的代理

```objc
@interface ViewController () <NSURLSessionDownloadDelegate>

/** 下载进度条 */
@property (weak, nonatomic) IBOutlet UIProgressView *progressView;
/** 下载进度条Label */
@property (weak, nonatomic) IBOutlet UILabel *progressLabel;

/** NSURLSession断点下载（不支持离线）需用到的属性 **********/
/** 下载任务 */
@property (nonatomic, strong) NSURLSessionDownloadTask *downloadTask;
/** 保存上次的下载信息 */
@property (nonatomic, strong) NSData *resumeData;

/** session */
@property (nonatomic, strong) NSURLSession *session;

@end
```

- 实现下面的按钮点击代码，其中用到了session的懒加载。

```objc
/**
 * 点击按钮 -- 使用NSURLSession断点下载（不支持离线）
 */
- (IBAction)resumeDownloadBtnClicked:(UIButton *)sender {
    // 按钮状态取反
    sender.selected = !sender.isSelected;
    
    if (nil == self.downloadTask) { // [开始下载/继续下载]
        if (self.resumeData) { // [继续下载]
            // 传入上次暂停下载返回的数据，就可以恢复下载
            self.downloadTask = [self.session downloadTaskWithResumeData:self.resumeData];
            
            // 开始任务
            [self.downloadTask resume];
            
            self.resumeData = nil;
        }else{ // [开始下载]：从0开始下载
            NSURL* url = [NSURL URLWithString:@"https://dldir1.qq.com/qqfile/QQforMac/QQ_V5.4.0.dmg"];
            
            // 创建任务
            self.downloadTask = [self.session downloadTaskWithURL:url];
            
            // 开始任务
            [self.downloadTask resume];
        }
        
    }else{ // [暂停下载]
        __weak typeof(self) weakSelf = self;
        [self.downloadTask cancelByProducingResumeData:^(NSData *resumeData) {
            // resumeData：包含了继续下载的位置\下载的路径
            weakSelf.resumeData = resumeData;
            weakSelf.downloadTask = nil;
        }];
    }
}
```

- 这里使用到了代理，所以我们要实现NSURLSessionDownloadDelegate的相关方法。代码和之前**2.2 NSURLSession（代理方法）**中实现的代理方法一致。

这里使用了NSURLSessionDownloadTask完成离线下载。但是NSURLSessionDownloadTask会自动将文件下载到了tmp临时文件中。我们只能在文件下载完毕的时候，将临时下载文件转存到永久文件路径保存起来。这样的话，如果程序被杀死，再次启动的时候，之前下载的临时文件已经消失了。我们很难拿到已经下载的文件，然后继续下载。

不过没关系，我们可以用NSURLSessionDataTask来实现NSURLSession的离线断点下载。

## 2.4 NSURLSession（断点下载 | 支持离线）


![NSURLSession（断点下载 | 支持离线）下载效果.gif](https://upload-images.jianshu.io/upload_images/1877784-8550bccfa3ba4129.gif?imageMogr2/auto-orient/strip)


NSURLSessionDataTask在发送请求之后，能够将返回的数据，作为data一部分一部分的接受过来。这样，我们就可以像NSURLConnection上边那样，创建一个NSFilehandle（文件句柄）类，在接受数据的时候，一点点写入永久沙盒文件中。并且在下次开始的时候，设置好HTTP请求头的Rang。我们就可以实现离线断点下载了。

具体实现过程如下：
- 定义下载文件需要用到的类和要实现的代理

```objc
@interface ViewController () <NSURLSessionDataDelegate>

/** 下载进度条 */
@property (weak, nonatomic) IBOutlet UIProgressView *progressView;
/** 下载进度条Label */
@property (weak, nonatomic) IBOutlet UILabel *progressLabel;

/** NSURLSession断点下载（支持离线）需用到的属性 **********/
/** 文件的总长度 */
@property (nonatomic, assign) NSInteger fileLength;
/** 当前下载长度 */
@property (nonatomic, assign) NSInteger currentLength;
/** 文件句柄对象 */
@property (nonatomic, strong) NSFileHandle *fileHandle;

/** 下载任务 */
@property (nonatomic, strong) NSURLSessionDataTask *downloadTask;
/** session */
@property (nonatomic, strong) NSURLSession *session;

@end
```

- 添加支持断点下载的[开始下载/暂停下载]按钮，并实现相应功能的代码

```objc
/**
 * session的懒加载
 */
- (NSURLSession *)session
{
    if (!_session) {
        _session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration] delegate:self delegateQueue:[NSOperationQueue mainQueue]];
    }
    return _session;
}

/**
 * downloadTask的懒加载，这里设置请求头中的Range
 */
- (NSURLSessionDataTask *)downloadTask {
    if (!_downloadTask) {
        // 创建下载URL
        NSURL *url = [NSURL URLWithString:@"https://dldir1.qq.com/qqfile/QQforMac/QQ_V5.4.0.dmg"];
        
        // 2.创建request请求
        NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
        
        // 设置HTTP请求头中的Range
        NSString *range = [NSString stringWithFormat:@"bytes=%zd-", self.currentLength];
        [request setValue:range forHTTPHeaderField:@"Range"];
        
        // 3. 下载
        _downloadTask = [self.session dataTaskWithRequest:request];
    }
    return _downloadTask;
}

/**
 * 点击按钮 -- 使用NSURLSession断点下载（支持离线）
 */
- (IBAction)OfflinResumeDownloadBtnClicked:(UIButton *)sender {
    // 按钮状态取反
    sender.selected = !sender.isSelected;
    
    if (sender.selected) { // [开始下载/继续下载]
        // 沙盒文件路径
        NSString *path = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) lastObject] stringByAppendingPathComponent:@"QQ_V5.4.0.dmg"];
        
        NSInteger currentLength = [self fileLengthForPath:path];
        if (currentLength > 0) {  // [继续下载]
            self.currentLength = currentLength;
        }
        
        [self.downloadTask resume];
        
    } else {
        [self.downloadTask suspend];
        self.downloadTask = nil;
    }
}

/**
 * 获取已下载的文件大小
 */
- (NSInteger)fileLengthForPath:(NSString *)path {
    NSInteger fileLength = 0;
    NSFileManager *fileManager = [[NSFileManager alloc] init]; // default is not thread safe
    if ([fileManager fileExistsAtPath:path]) {
        NSError *error = nil;
        NSDictionary *fileDict = [fileManager attributesOfItemAtPath:path error:&error];
        if (!error && fileDict) {
            fileLength = [fileDict fileSize];
        }
    }
    return fileLength;
}
```

- 最后实现相关的NSURLSessionDataDelegate方法，可参考NSURLConnection实现断点下载的方法。
  - 相关文章链接：[iOS网络--『文件下载、断点下载』（一）：NSURLConnection](https://www.jianshu.com/p/ce3eaee74bde)。

```objc
#pragma mark - <NSURLSessionDataDelegate> 实现方法
/**
 * 接收到响应的时候：创建一个空的沙盒文件
 */
- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveResponse:(NSURLResponse *)response completionHandler:(void (^)(NSURLSessionResponseDisposition))completionHandler
{
    // 获得下载文件的总长度：请求下载的文件长度 + 当前已经下载的文件长度
    self.fileLength = response.expectedContentLength + self.currentLength;
    
    // 沙盒文件路径
    NSString *path = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) lastObject] stringByAppendingPathComponent:@"QQ_V5.4.0.dmg"];
    
    NSLog(@"File downloaded to: %@",path);
    
    // 创建一个空的文件到沙盒中
    NSFileManager *manager = [NSFileManager defaultManager];
    
    if (![manager fileExistsAtPath:path]) {
        // 如果没有下载文件的话，就创建一个文件。如果有下载文件的话，则不用重新创建(不然会覆盖掉之前的文件)
        [manager createFileAtPath:path contents:nil attributes:nil];
    }
    
    // 创建文件句柄
    self.fileHandle = [NSFileHandle fileHandleForWritingAtPath:path];

    // 允许处理服务器的响应，才会继续接收服务器返回的数据
    completionHandler(NSURLSessionResponseAllow);
}

/**
 * 接收到具体数据：把数据写入沙盒文件中
 */
- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data
{
    // 指定数据的写入位置 -- 文件内容的最后面
    [self.fileHandle seekToEndOfFile];
    
    // 向沙盒写入数据
    [self.fileHandle writeData:data];
    
    // 拼接文件总长度
    self.currentLength += data.length;
    
    NSLog(@"%ld",self.currentLength);
    
    __weak typeof(self) weakSelf = self;
    // 获取主线程，不然无法正确显示进度。
    NSOperationQueue* mainQueue = [NSOperationQueue mainQueue];
    [mainQueue addOperationWithBlock:^{
        // 下载进度
        weakSelf.progressView.progress =  1.0 * weakSelf.currentLength / weakSelf.fileLength;
        weakSelf.progressLabel.text = [NSString stringWithFormat:@"当前下载进度:%.2f%%",100.0 * self.currentLength / self.fileLength];
    }];
}

/**
 *  下载完文件之后调用：关闭文件、清空长度
 */
- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
    // 关闭fileHandle
    [self.fileHandle closeFile];
    self.fileHandle = nil;
    
    // 清空长度
    self.currentLength = 0;
    self.fileLength = 0;
}
```

这样就使用NSURLSession、NSURLSessionDataTask实现了『离线断点下载』的需求。
