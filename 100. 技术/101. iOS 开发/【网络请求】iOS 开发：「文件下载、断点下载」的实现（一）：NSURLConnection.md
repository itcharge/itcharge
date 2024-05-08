<!--more-->

> 关于「文件下载、断点下载」所有实现的Demo地址：[Demo地址](https://github.com/itcharge/YSC-DownloadDemo)

# 1. 文件下载简介

> 在iOS开发过程中，我们经常会遇到文件下载的需求，比如说图片下载、音乐下载、视频下载，还有其他文件资源下载等等。

下面我们就把文件下载相关方法和知识点总结一下。

## 1.1 文件下载分类

### 1.1.1 按文件大小划分

按照开发中实际需求，如果按下载的文件大小来分类的话，可以分为：小文件下载、大文件下载。

因为小文件下载基本不需要等待，可以使用返回整个文件的下载方式来进行文件下载，比如说图片。但是大文件下载需要考虑很多情况来改善用户体验，比如说：下载进度的显示、暂停下载以及断点续传、离线断点续传，还有下载时占用手机内存情况等等。

### 1.1.2 按实现方法划分

如果按照开发中使用到的下载方法的话，我们可以使用NSData、NSURLConnection（iOS9.0之后舍弃）、NSURLSession（推荐），以及使用第三方框架AFNetworking等方式下载文件。

下面我们就根据文件大小，以及对应的实现方法来讲解下「文件下载、断点下载」的具体实现。本文主要讲解NSData和NSURLConnection。

# 2. 文件下载实现讲解

## 2.1 NSData（适用于小文件下载）


![NSData小文件下载效果.gif](http://qcdn.itcharge.cn/images/iOS-Resume-Download-NSURLConnection-001.gif)

- 我们可以使用NSData的 `+ (id)dataWithContentsOfURL:(NSURL *)url;`进行小文件的下载
- 这个方法实际上是发送一次GET请求，然后返回整个文件。
- **注意：需要将下面的代码放到子线程中。**

具体实现代码如下：

```objc
// 创建下载路径
NSURL *url = [NSURL URLWithString:@"https://pics.sc.chinaz.com/files/pic/pic9/201508/apic14052.jpg"];

// 使用NSData的dataWithContentsOfURL:方法下载
NSData *data = [NSData dataWithContentsOfURL:url];

// 如果下载的是将要显示的图片，则可以显示出来
// 如果下载的是其他文件，然后可以将data转存为本地文件
```

## 2.2 NSURLConnection
### 2.2.1 NSURLConnection（小文件下载）


![NSURLConnection小文件下载效果.gif](http://qcdn.itcharge.cn/images/iOS-Resume-Download-NSURLConnection-002.gif)

我们可以通过NSURLConnection发送异步GET请求来下载文件。

```objc
// 创建下载路径
NSURL *url = [NSURL URLWithString:@"https://pics.sc.chinaz.com/files/pic/pic9/201508/apic14052.jpg"];

// 使用NSURLConnection发送异步GET请求，该方法在iOS9.0之后就废除了（推荐使用NSURLSession）
[NSURLConnection sendAsynchronousRequest:[NSURLRequest requestWithURL:url] queue:[NSOperationQueue mainQueue] completionHandler:^(NSURLResponse *response, NSData *data, NSError *connectionError) {
    NSLog(@"%@",data);

    // 可以在这里把下载的文件保存起来
}];
```

### 2.2.2 NSURLConnection（大文件下载）


![NSURLConnection大文件下载效果.gif](http://qcdn.itcharge.cn/images/iOS-Resume-Download-NSURLConnection-003.gif)

对于大文件的下载，我们就不能使用上边的方法来下载了。因为你如果是几百兆以上的大文件，那么上边的方法返回的data就会一直在内存里，这样内存必然会爆掉，所以用上边的方法不合适。那么我们可以使用NSURLConnection的另一个方法`+ (NSURLConnection*)connectionWithRequest:(NSURLRequest *)request delegate:(id)delegate`通过发送异步请求，并实现相关代理方法来实现大文件的下载。

```objc
// 创建下载路径
NSURL *url = [NSURL URLWithString:@"https://120.25.226.186:32812/resources/videos/minion_15.mp4"];
// 使用NSURLConnection发送异步GET请求，并实现相应的代理方法，该方法iOS9.0之后废除了（推荐使用NSURLSession）。
[NSURLConnection connectionWithRequest:[NSURLRequest requestWithURL:url] delegate:self];
```

这里使用到了代理，所以我们要实现NSURLConnectionDataDelegate的相关方法。主要用到以下几个方法。

```objc
/**
 * 接收到响应的时候就会调用
 */
- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response;

/**
 * 接收到具体数据的时候会调用，会频繁调用
 */
- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data;

/**
 * 下载完文件之后调用
 */
- (void)connectionDidFinishLoading:(NSURLConnection *)connection;

/** 
 *  请求失败时调用（请求超时、网络异常） 
 */ 
- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error;
```

其中，`didReceiveData`方法会在接受到具体数据的时候被频繁调用，而且每一次都传过来一部分data。

所以，我们可以创建一个全局NSMutableData来拼接每部分数据，最后将拼接完整的Data保存为文件。

但是这样的话，NSMutableData会随着拼接的数据而逐渐变得越来越大，这样会导致内存爆掉。这样做显然不适合。

>**那么我们应该怎么做呢？**

我们应该在每获取一部分数据的时候，就将这部分数据写入沙盒中保存起来，并把这部分数据释放掉。

所幸我们有NSFilehandle（文件句柄）类，可以实现对文件的读取、写入、更新。

我们需要做如下几步：
1. 在接受到响应的时候，即在`didReceiveResponse`中创建一个空的沙盒文件，并且创建一个NSFilehandle类。
2. 在接受到具体数据的时候，即在`didReceiveData`中向沙盒文件中写入数据。
    - 通过NSFilehandle的`- (void)seekToFileOffset:(unsigned long long)offset;`方法，制定文件的写入位置。或者通过NSFilehandle的`- (unsigned long long)seekToEndOfFile;`方法，直接制定文件的写入位置为文件末尾。
    - 然后通过NSFilehandle的`writeData`方法，我们可以想沙盒中的文件不断写入新数据。

3. 在下载完成之后，关闭沙盒文件。

具体实现过程如下：
- 定义下载文件需要用到的类和要实现的代理

```objc
@interface ViewController () <NSURLConnectionDataDelegate>

/** 下载进度条 */
@property (weak, nonatomic) IBOutlet UIProgressView *progressView;
/** 下载进度条Label */
@property (weak, nonatomic) IBOutlet UILabel *progressLabel;

/** NSURLConnection下载大文件需用到的属性 **********/
/** 文件的总长度 */
@property (nonatomic, assign) NSInteger fileLength;
/** 当前下载长度 */
@property (nonatomic, assign) NSInteger currentLength;
/** 文件句柄对象 */
@property (nonatomic, strong) NSFileHandle *fileHandle;

@end
```

- 然后使用NSURLConnection的代理方式下载大文件

```objc
// 创建下载路径
NSURL *url = [NSURL URLWithString:@"https://bmob-cdn-8782.b0.upaiyun.com/2017/01/17/24b0b37f40d8722480a23559298529f4.mp3"];

// 使用NSURLConnection发送异步Get请求，并实现相应的代理方法，该方法iOS9.0之后废除了。
[NSURLConnection connectionWithRequest:[NSURLRequest requestWithURL:url] delegate:self];
```

- 最后实现相关的NSURLConnectionDataDelegate方法

```objc
#pragma mark - <NSURLConnectionDataDelegate> 实现方法

/**
 * 接收到响应的时候：创建一个空的沙盒文件和文件句柄
 */
- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response
{
    // 获得下载文件的总长度
    self.fileLength = response.expectedContentLength;

    // 沙盒文件路径
    NSString *path = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) lastObject] stringByAppendingPathComponent:response.suggestedFilename];

    // 打印下载的沙盒路径
    NSLog(@"File downloaded to: %@",path);

    // 创建一个空的文件到沙盒中
    [[NSFileManager defaultManager] createFileAtPath:path contents:nil attributes:nil];

    // 创建文件句柄
    self.fileHandle = [NSFileHandle fileHandleForWritingAtPath:path];
}

/**
 * 接收到具体数据：把数据写入沙盒文件中
 */
- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data
{
    // 指定数据的写入位置 -- 文件内容的最后面
    [self.fileHandle seekToEndOfFile];

    // 向沙盒写入数据
    [self.fileHandle writeData:data];

    // 拼接文件总长度
    self.currentLength += data.length;

    // 下载进度
    self.progressView.progress =  1.0 * self.currentLength / self.fileLength;
    self.progressLabel.text = [NSString stringWithFormat:@"当前下载进度:%.2f%%",100.0 * self.currentLength / self.fileLength];
}

/**
 *  下载完文件之后调用：关闭文件、清空长度
 */
- (void)connectionDidFinishLoading:(NSURLConnection *)connection
{
    // 关闭fileHandle
    [self.fileHandle closeFile];
    self.fileHandle = nil;

    // 清空长度
    self.currentLength = 0;
    self.fileLength = 0;
}
```

### 2.2.3 NSURLConnection（断点下载 | 支持离线）

![NSURLConnection离线断点下载效果.gif](http://qcdn.itcharge.cn/images/iOS-Resume-Download-NSURLConnection-004.gif)

NSURLConnection并没有提供暂停下载的方法，只提供了取消下载任务的`cancel`方法。

那么，如果我们想要使用NSURLConnection来实现断点下载的功能，就需要先了解HTTP请求头中Range的知识点。

HTTP请求头中的Range可以只请求实体的一部分，指定范围。

Range请求头的格式为： `Range: bytes=start-end`

例如：
`Range: bytes=10-`：表示第10个字节及最后个字节的数据。
`Range: bytes=40-100`：表示第40个字节到第100个字节之间的数据。

注意：这里的[start,end]，即是包含请求头的start及end字节的。所以，下一个请求，应该是上一个请求的[end+1, nextEnd]。

所以我们需要做的步骤为：
1. 添加需要实现断点下载的[开始/暂停]按钮。
2. 设置一个NSURLConnection的全局变量。
3. 如果继续下载，设置HTTP请求头的Range为当前已下载文件的长度位置到最后文件末尾位置。然后创建一个NSURLConnection发送异步下载，并监听代理方法。
4. 如果暂停下载，那么NSURLConnection发送取消下载方法，并清空。

具体实现过程如下：
- 定义下载文件需要用到的类和要实现的代理

```objc
@interface ViewController () <NSURLConnectionDataDelegate>

/** 下载进度条 */
@property (weak, nonatomic) IBOutlet UIProgressView *progressView;
/** 下载进度条Label */
@property (weak, nonatomic) IBOutlet UILabel *progressLabel;

/** NSURLConnection实现断点下载（支持离线）需要用到的属性 **********/
/** 文件的总长度 */
@property (nonatomic, assign) NSInteger fileLength;
/** 当前下载长度 */
@property (nonatomic, assign) NSInteger currentLength;
/** 文件句柄对象 */
@property (nonatomic, strong) NSFileHandle *fileHandle;

/* connection */
@property (nonatomic, strong) NSURLConnection *connection;

@end
```

- 添加支持断点下载的[开始下载/暂停下载]按钮，并实现相应功能的代码

```objc
/**
 * 点击按钮 -- 使用NSURLConnection断点下载（支持离线）
 */
- (IBAction)resumeDownloadBtnClicked:(UIButton *)sender {
    // 按钮状态取反
    sender.selected = !sender.isSelected;
    
    if (sender.selected) {  // [开始下载/继续下载]
        // 沙盒文件路径
        NSString *path = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) lastObject] stringByAppendingPathComponent:@"QQ_V5.4.0.dmg"];
        
        // fileLengthForPath: 方法用来判断已下载文件大小
        NSInteger currentLength = [self fileLengthForPath:path];
        if (currentLength > 0) {  // [继续下载]
            self.currentLength = currentLength;
        }
        // 1. 创建下载URL
        NSURL *url = [NSURL URLWithString:@"https://dldir1.qq.com/qqfile/QQforMac/QQ_V5.4.0.dmg"];
            
        // 2. 创建request请求
        NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
            
        // 3. 设置HTTP请求头中的Range
        NSString *range = [NSString stringWithFormat:@"bytes=%ld-", self.currentLength];
        [request setValue:range forHTTPHeaderField:@"Range"];
            
        // 4.下载
        self.connection = [NSURLConnection connectionWithRequest:request delegate:self];
    } else {    // [暂停下载]
        [self.connection cancel];
        self.connection = nil;
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

- 最后实现相关的NSURLConnectionDataDelegate方法，这里和上边使用NSURLConnection实现大文件下载的代码一致。

```objc
#pragma mark <NSURLConnectionDataDelegate> 实现方法

/**
 * 接收到响应的时候：创建一个空的沙盒文件
 */
- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response
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

}

/**
 * 接收到具体数据：把数据写入沙盒文件中
 */
- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data
{
    // 指定数据的写入位置 -- 文件内容的最后面
    [self.fileHandle seekToEndOfFile];
    
    // 向沙盒写入数据
    [self.fileHandle writeData:data];
    
    // 拼接文件总长度
    self.currentLength += data.length;
    
    // 下载进度
    self.progressView.progress =  1.0 * self.currentLength / self.fileLength;
    self.progressLabel.text = [NSString stringWithFormat:@"当前下载进度:%.2f%%",100.0 * self.currentLength / self.fileLength];
}

/**
 *  下载完文件之后调用：关闭文件、清空长度
 */
- (void)connectionDidFinishLoading:(NSURLConnection *)connection
{
    // 关闭fileHandle
    [self.fileHandle closeFile];
    self.fileHandle = nil;
    
    // 清空长度
    self.currentLength = 0;
    self.fileLength = 0;
}
```

这样就使用NSURLConnection实现了「断点下载」的需求，并且支持程序被杀死，重新启动之后也能接着下载的需求。
