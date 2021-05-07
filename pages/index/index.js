// index.js
// 获取应用实例
const app = getApp()

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName') // 如需尝试获取用户信息可改为false
  },
  // 事件处理函数
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  ab2hex(buffer) {
    let hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function(bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  },

  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }

    wx.onBLECharacteristicValueChange(function(res) {
      console.log(res)
      console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
      // console.log(this.ab2hex(res.value))
      let buffer = res.value;
      let hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function(bit) {
          return ('00' + bit.toString(16)).slice(-2)
        }
      )
      console.log(hexArr.join(''))
      // return hexArr.join('');
    });

    // 1.打开蓝牙适配器 https://www.cnblogs.com/tangyuanby2/p/10495869.html
    wx.openBluetoothAdapter({
      success: function(res) {
        console.log(res,"success1")
        // 2.适配器打开后可以开始搜索蓝牙设备了
        wx.startBluetoothDevicesDiscovery({
          services: [],
          success: function (res) {
            console.log(res)
            setTimeout((function callback() {
              // 3.搜索一小段时间后可以查看搜索到的设备，一般时间很短，1s都不用，搜不到可以多等等
              wx.getBluetoothDevices({
                success: function (res) {
                  console.log(res)
                  let i=0;
                  while (res.devices[i]) {
                    console.log(i);
                    console.log(res.devices[i].name);
                    console.log(res.devices[i].deviceId);
                    if(res.devices[i].name=='HC-02'){
                      let deviceId=res.devices[i].deviceId;
                      console.log(deviceId);
                      wx.createBLEConnection({
                        deviceId:deviceId,
                        success: (res) => {
                          console.log('连接成功', res);
                          // 4.现在我们可以获取一个特定设备的所有服务了
                          let serviceId = [];
                          wx.getBLEDeviceServices({
                            deviceId: deviceId,
                            success: function(res1) {
                              // console.log(res1);
                              console.log('device services:', res1.services)
                              let j=0;
                              while(res1.services[j]){
                                console.log(res1.services[j].uuid);
                                serviceId[j]=res1.services[j].uuid;
                                j++;
                              }

                              // 5.现在我们可以针对一个特定服务查看这个服务所支持的操作
                              let characteristicId = [];
                              wx.getBLEDeviceCharacteristics({
                                deviceId: deviceId,
                                serviceId: serviceId[1],
                                success: function (res2) {
                                  console.log('device characteristics:', res2.characteristics)
                                  let k=0;
                                  while(res2.characteristics[k]){
                                    characteristicId[k]=res2.characteristics[k].uuid;
                                    console.log(characteristicId[k]);
                                    k++;
                                  }

                                  wx.notifyBLECharacteristicValueChange({
                                    state: true, // 启用 notify 功能
                                    // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接  
                                    deviceId: deviceId,
                                    // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
                                    serviceId: serviceId[1],
                                    // 这里的 characteristicId 需要在 getBLEDeviceCharacteristics 接口中获取
                                    characteristicId: characteristicId[2],
                                    success (res) {
                                      console.log('notifyBLECharacteristicValueChange success', res.errMsg)
                                    },
                                    fail: function (res3) {
                                      console.log(res3)
                                    }
                                  });

                                  let buffer = new ArrayBuffer(1)
                                  let dataView = new DataView(buffer)
                                  dataView.setUint8(0, 1)
                                  console.log('value:', buffer);
                                  // 需要向只写characteristicId 写入指令
                                  wx.writeBLECharacteristicValue({
                                    deviceId: deviceId,
                                    serviceId: serviceId[1],
                                    characteristicId: characteristicId[3],
                                    value: buffer,
                                    success: function (res3) {
                                      console.log('writeBLECharacteristicValue success', res3.errMsg)
                                    },
                                    fail: function (res3) {
                                      console.log(res3)
                                    },
                                  })
                                }
                              })
                            },
                            fail: function (res2) {
                              console.log(res2)
                            },
                          })
                        },
                        fail:(e)=>{
                          console.log(e)
                        }
                        
                      })
                      

                      

                    }
                    i++;
                  }
                }
              })
            }).bind(this), 1000);
          },
          fail: function (res) {
            console.log("fail2")
          },
        })
      },
      fail: function (res) {
      console.log("fail1")
      },
    })
    

    

  },
  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  getUserInfo(e) {
    // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
    console.log(e)
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})
