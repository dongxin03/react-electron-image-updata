import React,{Component} from 'react';
import * as qiniu from 'qiniu-js';
import nodeQiniu from 'qiniu';
import {accessKey,secretKey} from './keyData';
const host = 'http://youxiangshijie.cn/';


class SelectImage extends Component{
    constructor(){
        super();
        this.state={
            selectImgName:'',
            imagePath:'',
            imageType:'',
            loadUrl:'',
            progress:0,
            showMessage:false,
            message:''
        }
        this.setImageInfo = this.setImageInfo.bind(this);
        this.pullImageFunct = this.pullImageFunct.bind(this);
        this.imageBlob = this.imageBlob.bind(this);
        this.inputFunct = this.inputFunct.bind(this);
        this.imageUpData = this.imageUpData.bind(this);
        this.urlCopy = this.urlCopy.bind(this);
    }
    componentDidMount(){
        this.pullImageFunct();
    }

    pullImageFunct(){ // 拖拽图片获取
        this.dropEle = document.querySelector('.into');
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
                    thse.setImageInfo(file);
                }
            }
        });
    }
    inputFunct(e){ // 选择图片
        const path = e.target.files[0]['path'];
        const type = e.target.files[0]['type'];
        // 正则去文件名字  /.*\/([^\/]+)\..+/
        const rgx = /.*\/([^\/]+)/;
        const name = rgx.exec(path)[1];
        this.setImageInfo({path,name,type})
    }
    setImageInfo(info){ // 设置上传参数
        this.setState({
            imagePath:info.path,
            selectImgName:info.name,
            imageType:info.type,
            showMessage:false,
        })
    }
    imageBlob(){ //获取图片 blob
        const ther = this;
        const {imagePath} = this.state;
        if(!imagePath){
            this.setState({
                showMessage:true,
                message:'未获取到图片'
            })
            return;
        }
        const xhr = new XMLHttpRequest();
        xhr.open("get", `file://${imagePath}`, true);
        xhr.responseType = "blob";
        xhr.onload = async function () {
            if (this.status === 200) {
                //得到一个blob对象
                var blob = this.response;
                const token = await ther.getToKen();
                ther.imageUpData({token,blob})
            }
        }
        xhr.send();
    }
    imageUpData({token,blob}){ // 上传图片
        const {selectImgName,imageType} = this.state;
        const ther = this;
        const putExtra = {
            fname: "",
            params: {},
            mimeType: [imageType]
        };
        const config = {
            useCdnDomain: true,
            region: qiniu.region.z2
        };
        const observable = qiniu.upload(blob,selectImgName,token,putExtra,config);
        observable.subscribe({
            next(res){
                ther.setState({
                    progress:res.total.percent.toFixed(2)
                })
            },
            error(err){
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
            complete(res){
                ther.setState({
                    loadUrl:res.key,
                    progress:0,
                    isSuccess:true,
                    message:'成功--点击下方复制url'
                })
            }
        })
    }
    getToKen(){ // 获取token
        return new Promise((res,rej)=>{
            const bucket = 'image_list';
            let mac = new nodeQiniu.auth.digest.Mac(accessKey, secretKey);
            let options = {
                scope: bucket,
                expires: 3600 * 24
            };
            let putPolicy =  new nodeQiniu.rs.PutPolicy(options);
            let uploadToken= putPolicy.uploadToken(mac);
            if(uploadToken){
                res(uploadToken);
            }else{
                rej();
            }
        });
    }
    urlCopy(){ //点击复制url
        const {loadUrl} = this.state;
        const inputElement = document.querySelector('.copy_content');
        inputElement.value = host+loadUrl;
        inputElement.select();
        document.execCommand("Copy");
        global.alert('复制成功');
    }
    render(){
        const {
            selectImgName,
            loadUrl,
            progress,
            showMessage,
            message
        } = this.state;
        return([
            <div className="content" key="content">
                <div className="set-button">
                    <span onClick={this.imageBlob}>上传</span>
                    {/* <span>设置</span> */}
                </div>
                <div className="select-content">
                    <div className="into">
                        {selectImgName ? 
                            <ul>
                                <li>{selectImgName}</li>
                            </ul> : null
                        }
                        <p>将图片拖入</p>
                        {progress ? <p style={{marginTop:'30px',paddingTop:0}}>{progress}%</p> : null}
                        {showMessage ? <p style={{marginTop:'30px',paddingTop:0}}>{message}</p> : null}
                    </div>
                    <div className="select-image-button">
                        <input className="iamge-file" type="file" onChange={this.inputFunct}/>
                        <span>选择图片</span>
                    </div>
                </div>
            </div>,
            <div className="updata-url" key="updata-url">
                <p>图片url:</p>
                    <p className="image-url">{host+loadUrl}</p>
                <p className="copy" onClick={this.urlCopy}>点击复制</p>
                <input 
                    className="copy_content" 
                    type="text" 
                    value=""  
                    onChange={()=>{}}
                    style={{position: 'absolute','top':0,'left': 0,'opacity': 0,'zIndex':'-10'}}
                />
            </div>
        ])
    }
}


export default SelectImage;