<!--more-->

> 关于「文件下载、断点下载」所有实现的Demo地址：[Demo地址](https://github.com/itcharge/YSC-DownloadDemo)

## 1. AFNetworking下载简介

这里只讲解AFNetworking下载文件相关知识。对于第三方框架的导入在这里不做讲解，如果有问题可以上AFNetworking的GitHub上了解。—> [AFNetworking官方地址](https://github.com/AFNetworking/AFNetworking)

## 2. AFNetworking下载相关

### 2.1 AFNetworking（文件下载）

![](http://qcdn.itcharge.cn/images/iOS-Resume-Download-AFNetworking-001.gif)

AFNetworking实现文件下载总共四步：

1. 创建会话管理者
2. 创建下载路径和请求对象
3. 创建下载任务
4. 启动下载任务

具体实现代码如下：

```objc
NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
// 1. 创建会话管理者
AFURLSessionManager *manager = [[AFURLSessionManager alloc] initWithSessionConfiguration:configuration];
    
// 2. 创建下载路径和请求对象
NSURL *URL = [NSURL URLWithString:@"https://dldir1.qq.com/qqfile/QQforMac/QQ_V5.4.0.dmg"];
NSURLRequest *request = [NSURLRequest requestWithURL:URL];
    
// 3.创建下载任务
/**
 * 第一个参数 - request：请求对象
 * 第二个参数 - progress：下载进度block
 *      其中： downloadProgress.completedUnitCount：已经完成的大小
 *            downloadProgress.totalUnitCount：文件的总大小
 * 第三个参数 - destination：自动完成文件剪切操作
 *      其中： 返回值:该文件应该被剪切到哪里
 *            targetPath：临时路径 tmp NSURL
 *            response：响应头
 * 第四个参数 - completionHandler：下载完成回调
 *      其中： filePath：真实路径 == 第三个参数的返回值
 *            error:错误信息
 */
NSURLSessionDownloadTask *downloadTask = [manager downloadTaskWithRequest:request progress:^(NSProgress *downloadProgress) {
        
    // 下载进度
    self.progressView.progress = 1.0 * downloadProgress.completedUnitCount / downloadProgress.totalUnitCount;
    self.progressLabel.text = [NSString stringWithFormat:@"当前下载进度:%.2f%%",100.0 * downloadProgress.completedUnitCount / downloadProgress.totalUnitCount];
        
} destination:^NSURL *(NSURL *targetPath, NSURLResponse *response) {
        
    NSURL *path = [[NSFileManager defaultManager] URLForDirectory:NSDocumentDirectory inDomain:NSUserDomainMask appropriateForURL:nil create:NO error:nil];
    return [path URLByAppendingPathComponent:@"QQ_V5.4.0.dmg"]; 
      
    } completionHandler:^(NSURLResponse *response, NSURL *filePath, NSError *error) {        
    NSLog(@"File downloaded to: %@", filePath);
}];

// 4. 开启下载任务
[downloadTask resume];
```

### 2.2 AFNetworking（断点下载 | 支持离线）

![](http://qcdn.itcharge.cn/images/20210729145510.gif)

- AFNetworking3.0是基于NSURLSession的。所以实现原理和NSURLSession差不多。可参考NSURLConnection实现断点下载的方法。
  - 相关文章链接：[iOS网络--「文件下载、断点下载」的实现（二）：NSURLSession](https://www.jianshu.com/p/5a07352e9473)。

这里使用了NSURLSessionDataTask，以便实现「离线断点下载」。

具体实现步骤如下：

1. 定义下载文件需要用到的类，这里不需要实现代理

```objc
@interface ViewController ()

/** 下载进度条 */
@property (weak, nonatomic) IBOutlet UIProgressView *progressView;
/** 下载进度条Label */
@property (weak, nonatomic) IBOutlet UILabel *progressLabel;

/** AFNetworking断点下载（支持离线）需用到的属性 **********/
/** 文件的总长度 */
@property (nonatomic, assign) NSInteger fileLength;
/** 当前下载长度 */
@property (nonatomic, assign) NSInteger currentLength;
/** 文件句柄对象 */
@property (nonatomic, strong) NSFileHandle *fileHandle;

/** 下载任务 */
@property (nonatomic, strong) NSURLSessionDataTask *downloadTask;
/* AFURLSessionManager */
@property (nonatomic, strong) AFURLSessionManager *manager;

@end
```

- 添加全局NSURLSessionDataTask、AFURLSessionManager懒加载代码。这里我把实现「离线断点下载」的代码都放这里了。

```objc
/**
 * manager的懒加载
 */
- (AFURLSessionManager *)manager {
    if (!_manager) {
        NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
        // 1. 创建会话管理者
        _manager = [[AFURLSessionManager alloc] initWithSessionConfiguration:configuration];
    }
    return _manager;
}

/**
 * downloadTask的懒加载
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
        
        __weak typeof(self) weakSelf = self;
        _downloadTask = [self.manager dataTaskWithRequest:request completionHandler:^(NSURLResponse * _Nonnull response, id  _Nullable responseObject, NSError * _Nullable error) {
            NSLog(@"dataTaskWithRequest");
            
            // 清空长度
            weakSelf.currentLength = 0;
            weakSelf.fileLength = 0;
            
            // 关闭fileHandle
            [weakSelf.fileHandle closeFile];
            weakSelf.fileHandle = nil;
            
        }];
        
        [self.manager setDataTaskDidReceiveResponseBlock:^NSURLSessionResponseDisposition(NSURLSession * _Nonnull session, NSURLSessionDataTask * _Nonnull dataTask, NSURLResponse * _Nonnull response) {
            NSLog(@"NSURLSessionResponseDisposition");
            
            // 获得下载文件的总长度：请求下载的文件长度 + 当前已经下载的文件长度
            weakSelf.fileLength = response.expectedContentLength + self.currentLength;
            
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
            weakSelf.fileHandle = [NSFileHandle fileHandleForWritingAtPath:path];
            
            // 允许处理服务器的响应，才会继续接收服务器返回的数据
            return NSURLSessionResponseAllow;
        }];
        
        [self.manager setDataTaskDidReceiveDataBlock:^(NSURLSession * _Nonnull session, NSURLSessionDataTask * _Nonnull dataTask, NSData * _Nonnull data) {
            NSLog(@"setDataTaskDidReceiveDataBlock");
            
            // 指定数据的写入位置 -- 文件内容的最后面
            [weakSelf.fileHandle seekToEndOfFile];
            
            // 向沙盒写入数据
            [weakSelf.fileHandle writeData:data];
            
            // 拼接文件总长度
            weakSelf.currentLength += data.length;
            
            // 获取主线程，不然无法正确显示进度。
            NSOperationQueue* mainQueue = [NSOperationQueue mainQueue];
            [mainQueue addOperationWithBlock:^{
                // 下载进度
                if (weakSelf.fileLength == 0) {
                    weakSelf.progressView.progress = 0.0;
                    weakSelf.progressLabel.text = [NSString stringWithFormat:@"当前下载进度:00.00%%"];
                } else {
                    weakSelf.progressView.progress =  1.0 * weakSelf.currentLength / weakSelf.fileLength;
                    weakSelf.progressLabel.text = [NSString stringWithFormat:@"当前下载进度:%.2f%%",100.0 * weakSelf.currentLength / weakSelf.fileLength];
                }
               
            }];
        }];
    }
    return _downloadTask;
}
```

- 添加支持断点下载的[开始下载/暂停下载]按钮，并实现相应功能的代码

```objc
/**
 * 点击按钮 -- 使用AFNetworking断点下载（支持离线）
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

这样我们用 AFNetworking 也实现了「离线断点下载」的需求。
