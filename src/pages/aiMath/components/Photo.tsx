import React, { useRef } from 'react'

export default function Photo({ onChange }) {
  const imgFile = useRef({})
  function transformFileToFormData(file) {
    const formData = new FormData()
    // 自定义formData中的内容
    // type
    formData.append('type', file.type)
    // size
    formData.append('size', file.size || 'image/jpeg')
    // name
    formData.append('name', file.name)
    // lastModifiedDate
    formData.append('lastModifiedDate', file.lastModifiedDate)
    // append 文件
    formData.append('file', file)
    // 上传图片
    onChange && onChange(formData)
  }
  // 将file转成dataUrl
  function transformFileToDataUrl(file) {
    const imgCompassMaxSize = 200 * 1024 // 超过 200k 就压缩

    // 存储文件相关信息
    imgFile.current.type = file.type || 'image/jpeg' // 部分安卓出现获取不到type的情况
    imgFile.current.size = file.size
    imgFile.current.name = file.name
    imgFile.current.lastModifiedDate = file.lastModifiedDate

    // 封装好的函数
    const reader = new FileReader()

    // file转dataUrl是个异步函数，要将代码写在回调里
    reader.onload = function (e) {
      const result = e.target.result

      if (result.length < imgCompassMaxSize) {
        compress(result, processData, false) // 图片不压缩
      } else {
        compress(result, processData) // 图片压缩
      }
    }

    reader.readAsDataURL(file)
  }
  // 使用canvas绘制图片并压缩
  function compress(dataURL, callback, shouldCompress = true) {
    const img = new window.Image()

    img.src = dataURL

    img.onload = function () {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      let compressedDataUrl

      if (shouldCompress) {
        compressedDataUrl = canvas.toDataURL(imgFile.current.type, 0.2)
      } else {
        compressedDataUrl = canvas.toDataURL(imgFile.current.type, 1)
      }

      callback(compressedDataUrl)
    }
  }

  function processData(dataUrl) {
    // 这里使用二进制方式处理dataUrl
    const binaryString = window.atob(dataUrl.split(',')[1])
    const arrayBuffer = new ArrayBuffer(binaryString.length)
    const intArray = new Uint8Array(arrayBuffer)

    for (let i = 0, j = binaryString.length; i < j; i++) {
      intArray[i] = binaryString.charCodeAt(i)
    }

    const data = [intArray]

    let blob

    try {
      blob = new Blob(data, { type: imgFile.current.type })
    } catch (error) {
      window.BlobBuilder =
        window.BlobBuilder ||
        window.WebKitBlobBuilder ||
        window.MozBlobBuilder ||
        window.MSBlobBuilder
      if (error.name === 'TypeError' && window.BlobBuilder) {
        const builder = new BlobBuilder()
        builder.append(arrayBuffer)
        blob = builder.getBlob(imgFile.current.type)
      } else {
        // Toast.error("版本过低，不支持上传图片", 2000, undefined, false);
        throw new Error('版本过低，不支持上传图片')
      }
    }

    // blob 转file
    const fileOfBlob = new File([blob], imgFile.current.name)
    const formData = new FormData()
    console.log(1112, fileOfBlob)
    // type
    formData.append('type', imgFile.current.type)
    // size
    formData.append('size', fileOfBlob.size)
    // name
    formData.append('name', imgFile.current.name)
    // lastModifiedDate
    formData.append('lastModifiedDate', imgFile.current.lastModifiedDate)
    // append 文件
    formData.append('file', fileOfBlob)

    onChange && onChange(formData.get('file'))
  }

  const handleCapture = (event) => {
    console.log(111122)
    const imgMasSize = 1024 * 1024 * 10
    const file = event.target.files[0]
    if (['jpeg', 'png', 'gif', 'jpg'].indexOf(file.type.split('/')[1]) < 0) {
      // 自定义报错方式
      // Toast.error("文件类型仅支持 jpeg/png/gif！", 2000, undefined, false);
      return
    }
    // 文件大小限制
    if (file.size > imgMasSize) {
      // 文件大小自定义限制
      // Toast.error("文件大小不能超过10MB！", 2000, undefined, false);
      return
    }

    // 判断是否是ios
    if (window.navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
      // iOS
      transformFileToFormData(file)
      return
    }

    // 图片压缩之旅
    transformFileToDataUrl(file)
  }
  return (
    <form>
      <label htmlFor="photo">
        <div
          style={{
            padding: '10px 20px',
            border: '1px solid #1677ff',
            borderRadius: 6,
            color: '#1677ff',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          拍照
        </div>
      </label>
      <input
        id="photo"
        type="file"
        style={{ display: 'none' }}
        accept="image/*"
        capture="environment" // 使用环境摄像头（通常是后置摄像头）
        onChange={(e) => handleCapture(e)}
      />
    </form>
  )
}
