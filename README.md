[博客位置](https://dongxin03.github.io/2019/11/28/react+electron%E6%90%AD%E5%BB%BA%E4%B8%83%E7%89%9B%E4%BA%91%E4%B8%8A%E4%BC%A0%E5%9B%BE%E7%89%87%E6%A1%8C%E9%9D%A2%E7%AB%AF/);
### 咋想的
> 每次上传图到七牛云，都需要登录七牛云找到仓库，上传。步骤有些繁琐。所以自己做个上传的小工具。
* 自己画的原型图————简单、明了、好看
![七牛云上传](http://youxiangshijie.cn/qiniuyunshangchuan.png?imageMogr2/auto-orient/thumbnail/!220x360r)
### 步骤
* 1、拖拽和选择图片，获取图片信息
* 2、获取上传token
* 3、点击上传
* 4、包装electron
—— 简简单单的四步

### 搭建
* 1、`create-react-app image-updata`搭建一个名字为image-updata的项目
   **这一步有必要且先执行这一步**
   ***这时候`yarn start`就可以看到react页面里***
   ![react页面](http://youxiangshijie.cn/create-react-page.png?imageMogr2/auto-orient/thumbnail/!120x360r)
* 2、**`yarn eject` || `npm run eject`** 可以显示出webpack配置文件 （修改了启动端口，默认3000 —— 不改也行，修改了静态文件打包路径，改成了相对路径 --不改也行。。。）
   * **修改启动端口**
      修改scripts/start.js 的DEFAULT_PORT （scripts文件夹没有？执行yarn eject）
   ![修改端口号](http://youxiangshijie.cn/xiugaiduankouhao.png?imageMogr2/auto-orient/thumbnail/!220x360r)
   * **修改静态文件打包路径**
      在yarn build 的时候build文件夹下的index.html里引入文件都用的是绝对路径，会找不到，---所以可以修改打包路径
      修改config/paths.js 的 getServedPage方法里的 servedUrl这块'/'改成'./'
   ![修改打包静态路径](http://youxiangshijie.cn/xiugai-dabao-jingtailujing.png?imageMogr2/auto-orient/thumbnail/!420x360r)
   **在执行`yarn eject`之后可能会报错，一般是缺少包，缺啥补啥就好**
   ![webpack报错](http://youxiangshijie.cn/webpack-baocuo.png?imageMogr2/auto-orient/thumbnail/!420x360r)
   `yarn add @babel/helper-create-regexp-features-plugin`

### 开始写页面
* 这里就比较简单，就一个页面所以把App.js改改就好
* **一开始是这样的**
![一开始](http://youxiangshijie.cn/qiniu-react-page-yikaishi.png?imageMogr2/auto-orient/thumbnail/!320x360r)
* **简单改改之后(结构就这样的)**
```
 <div className="App">
    <div className="content" key="content">
        <div className="set-button">
            <span onClick={()=>{}}>上传</span>
        </div>
        <div className="select-content">
            <div className="into">
                    <ul>
                        <li>图片名称</li>
                    </ul>
                <p>将图片拖入</p>
                <p style={{marginTop:'30px',paddingTop:0}}>100%</p>
                <p style={{marginTop:'30px',paddingTop:0}}>提示文字</p>
            </div>
            <div className="select-image-button">
                <input className="iamge-file" type="file" onChange={()=>{}}/>
                <span>选择图片</span>
            </div>
        </div>
    </div>
    <div className="updata-url" key="updata-url">
        <p>图片url:</p>
            <p className="image-url">图片地址</p>
        <p className="copy" onClick={this.urlCopy}>点击复制</p>
        <input 
            className="copy_content" 
            type="text" 
            value=""  
            onChange={()=>{}}
            style={{position: 'absolute','top':0,'left': 0,'opacity': 0,'zIndex':'-10'}}
        />
    </div>
</div>
```
   * 样式修改App.css,我就不多说了
* **这时候的页面**
![这时候的页面](http://youxiangshijie.cn/qiniu-react-page-xiugaihoudepage.png?imageMogr2/auto-orient/thumbnail/!320x360r)


### 开始步骤 1 拖拽和选择图片获取图片信息
* 1、**拖拽图片放下的时候获取图片信息**
```
pullImageFunct(){ // 拖拽图片获取
    this.dropEle = document.querySelector('.into'); // 监听的鼠标放下区域
    const thse = this;
    this.dropEle.addEventListener("dragenter", function (e) { //文件拖拽进
        e.preventDefault();
        e.stopPropagation();
    }, false);
    this.dropEle.addEventListener("dragover", function (e) { //文件拖拽在悬浮
        e.preventDefault();
        e.stopPropagation();
    }, false);
    this.dropEle.addEventListener("dragleave", function (e) {//文件拖拽离开
        e.preventDefault();
        e.stopPropagation();
    }, false);
    this.dropEle.addEventListener("drop", function (e) {//文件拖拽放下
        e.preventDefault();
        e.stopPropagation();
        // 处理拖拽文件的逻辑
        var df = e.dataTransfer;
        for(var i = 0; i < df.items.length; i++) {
            var item = df.items[i];
            if(item.kind === "file" && item.webkitGetAsEntry().isFile) {
                var file = item.getAsFile();
                thse.setImageInfo(file); // 统一设置文件信息
            }
        }
    });
}
```
   * **要禁止拖进、悬浮、拖出事件，否则会跳转**
   ```
   componentDidMount(){
       this.pullImageFunct();
   }
   ```
   * **拖拽事件需要监听**
* 2、**文件选择**
```
inputFunct(e){ // 选择图片
    const path = e.target.files[0]['path']; // 文件路径
    const type = e.target.files[0]['type']; 
    // 正则去文件名字  /.*\/([^\/]+)\..+/
    const rgx = /.*\/([^\/]+)/;
    const name = rgx.exec(path)[1];
    this.setImageInfo({path,name,type}) // 统一设置文件信息
}
```
* **需要在input的change事件执行**
*
* 统一设置文件信息
```
setImageInfo(info){ // 设置上传参数
    this.setState({
        imagePath:info.path,
        selectImgName:info.name,
        imageType:info.type,
        showMessage:false,
    })
}
```
* **这个时候就可以拿到文件的path、type、name。第一步完成**


### 开始步骤 2 获取上传token
> 七牛上传的时候需要token，获取tokan，需要accessKey，secretKey，都可以在七牛找到
**可以在密钥管理中找到**

![密钥管理](http://youxiangshijie.cn/qiniu-react-page-key.png?imageMogr2/auto-orient/thumbnail/!320x360r)

* **获取token**
`yarn add qiniu` 安装qnniu 

```
import nodeQiniu from 'qiniu';
const accessKey = ''; // 你的密钥
const secretKey = ''; // 你的密钥
getToKen(){ // 获取token
    return new Promise((res,rej)=>{
        const bucket = 'image_list'; // 这是你的图片仓库名
        let mac = new nodeQiniu.auth.digest.Mac(accessKey, secretKey);
        let options = {
            scope: bucket,
            expires: 3600 * 24 // 密钥过期时间
        };
        let putPolicy =  new nodeQiniu.rs.PutPolicy(options);
        let uploadToken= putPolicy.uploadToken(mac);
        if(uploadToken){
            res(uploadToken); // 你的上传token
        }else{
            rej();
        }
    });
}
```
* **这是好你的密钥和图片仓库名，就可以拿到密钥**

### 开始步骤 3 上传图片
`qiniu.upload` 是七牛上传图片的api，需要blob格式的图片
**图片设置blob,在点击上传click执行**
```
imageBlob(){ //获取图片 blob
    const ther = this;
    const {imagePath} = this.state; //文件路径
    if(!imagePath){
        this.setState({
            showMessage:true,
            message:'未获取到图片'
        })
        return;
    }
    const xhr = new XMLHttpRequest(); // ajax请求图片
    xhr.open("get", `file://${imagePath}`, true);
    xhr.responseType = "blob";
    xhr.onload = async function () {
        if (this.status === 200) {
            //得到一个blob对象
            var blob = this.response; // 图片blob
            const token = await ther.getToKen(); // 获取token
            ther.imageUpData({token,blob}) // 上传图片
        }
    }
    xhr.send();
}
```
**上传**
`yarn add qiniu-js` 安装
```
imageUpData({token,blob}){ // 上传图片 token,blob
    const {selectImgName,imageType} = this.state; //图片名称和图片type
    const ther = this;
    const putExtra = { // 上传需要的参数
        fname: "",
        params: {},
        mimeType: [imageType]
    };
    const config = { // 上传需要的参数
        useCdnDomain: true,
        region: qiniu.region.z2
    };
    const observable = qiniu.upload(blob,selectImgName,token,putExtra,config);
    observable.subscribe({
        next(res){
            ther.setState({
                progress:res.total.percent.toFixed(2) // 进度
            })
        },
        error(err){ // 失败
            if(err.code == 401){
                ther.setState({
                    showMessage:true,
                    message:'密钥错误，检查密钥'
                })
            }else{
                ther.setState({
                    showMessage:true,
                    message:err.message
                })
            }
        }, 
        complete(res){ // 成功
            ther.setState({
                loadUrl:res.key,
                progress:0,
                isSuccess:true,
                message:'成功--点击下方复制url'
            })
        }
    })
}
```

* **这时候就可以上传图片了**
*
* **点击复制**
* 需要设置个图片仓库中使用的域名
```
const host = ''; //你的图片仓库使用的域名 
urlCopy(){ //点击复制url
        const {loadUrl} = this.state; // 上传后返回的路径
        const inputElement = document.querySelector('.copy_content'); // 点击复制只能在input上
        inputElement.value = host+loadUrl;
        inputElement.select(); // 必须
        document.execCommand("Copy"); // 浏览器提供
        global.alert('复制成功');
    }
```


### 开始步骤 4 包装electron

`npm install electron --save-dev` 安装 ***这一步会很慢，可以转taobao的源***

* 在根目录创建 main.js 和 renderer.js
![mainjs](http://youxiangshijie.cn/qiniu-react-mainjs.png?imageMogr2/auto-orient/thumbnail/!320x360r)
* **main.js 本地测试注意端口号**
```
const { app, BrowserWindow } = require('electron');
const path = require('path');
let mainWindow = null;
//判断命令行脚本的第二参数是否含--debug
const debug = /--debug/.test(process.argv[2]);
function makeSingleInstance () {
    if (process.mas) return;
    app.requestSingleInstanceLock();
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })
}
function createWindow () {
    mainWindow = new BrowserWindow({
        width: 300,
        height: 500,
        webPreferences: {
            javascript: true,
            plugins: true,
            nodeIntegration: true, // 是否集成 Nodejs
            webSecurity: false,
            preload: path.join(__dirname, './renderer.js') // 但预加载的 js 文件内仍可以使用 Nodejs 的 API
        }
    })
    mainWindow.loadURL("http://localhost:8403/"); //本地测试注意端口号
    // mainWindow.loadURL(path.join('file://',__dirname,'/build/index.html')); //打包使用

    //接收渲染进程的信息
    const ipc = require('electron').ipcMain;
    ipc.on('min', function () {
        mainWindow.minimize();
    });
    ipc.on('max', function () {
        mainWindow.maximize();
    });
    ipc.on("login",function () {
        mainWindow.maximize();
    });
    mainWindow.on('closed', () => {
        mainWindow = null
    })
}
makeSingleInstance();
//app主进程的事件和方法
app.on('ready', () => {
    createWindow();
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
module.exports = mainWindow;
```
* **renderer.js 必须**
```
global.electron = require('electron');
```
**修改package.json**
* 添加main.js
![main.js](http://youxiangshijie.cn/qiniu-react-shezhipack.png?imageMogr2/auto-orient/thumbnail/!220x160r)
* 设置启动命令
`"start": "node scripts/start.js | electron . --debug",`

*这个时候关闭服务，在启动服务`yarn start`，就可以在electron中启动了
**有时候会出现端口占用的情况**
mac 可以 `lsof -i :端口号` 看端口占中  `kill -9 PID` 关闭进程
*
*
* **最后一步打包**
`npm install electron-packager --save-dev` 安装electron 打包工具
   * package.json 添加打包命令
   `"package": "electron-packager ./"`
   ![打包命令](http://youxiangshijie.cn/qiniu-react-dabaomingling.png?imageMogr2/auto-orient/thumbnail/!220x160r)
   * 修改main.js中的mainWindow.loadURL
   `mainWindow.loadURL(path.join('file://',__dirname,'/build/index.html'))`
* 执行 `yarn package` 会在根目录创建一个打包文件可以直接使用
* 可以修改`yarn package`命令定制打包名称、地址、打包系统、图标
* 什么都没设置会根据本地系统生成打包文件（我在mac上可以）
![打包的文件](http://youxiangshijie.cn/qiniu-react-dabaodewenjain.png?imageMogr2/auto-orient/thumbnail/!220x160r)


* 到此结束

