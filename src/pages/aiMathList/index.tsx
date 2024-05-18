import React, { useEffect, useState } from 'react'
import * as services from '@/request/api'
import { Flex, Image, Card, Input } from 'antd'
import { img2Store, configStore, userStore } from '@/store'
import { useNavigate } from 'react-router-dom'
const url = new URL(location.href)
const searchs = new URLSearchParams(url.search)
const taskid = searchs.get('taskid')
const { Search } = Input;
// function findNestedValue(data, valueToFind) {
//   // 定义一个内部递归函数
//   function search(data, parents) {
//     if (data === valueToFind) {
//       // 如果找到匹配的值，返回包含所有父级结构的对象
//       return parents.reduceRight((acc, current) => ({ [current.key]: acc }), data);
//     } else if (Array.isArray(data)) {
//       // 如果是数组，则对每个元素进行遍历搜索
//       return data.map((item, index) => search(item, parents.concat({ key: index })));
//     } else if (typeof data === 'object' && data !== null) {
//       // 如果是对象，则对每个属性进行搜索
//       return Object.keys(data).map((key) => search(data[key], parents.concat({ key })));
//     }
//     // 如果当前值不是数组或对象，也不是要找的值，返回null
//     return null;
//   }

  // 对搜索结果进行清理，删除为null的部分
  function clean(results) {
    if (Array.isArray(results)) {
      // 过滤非null值，并对数组项递归清理
      return results.map(clean).filter(value => value != null);
    } else if (results && typeof results === 'object') {
      // 清理对象属性中的null值
      Object.keys(results).forEach(key => {
        results[key] = clean(results[key]);
        if (results[key] == null) {
          delete results[key];
        }
      });
      // 如果对象为空，返回null
      return Object.keys(results).length > 0 ? results : null;
    }
    // 返回处理后的值（包括基本数据类型和非null对象）
    return results;
  }

  // 开始递归搜索，并清理结果
  return clean(search(data, []));
}

export default function Index() {
  const { token } = userStore();
  const navigate = useNavigate()
  const [cache, setCache] = useState([]);
  const [list, setList] = useState([]);
  useEffect(() => {
    services
      .getClassinfo({
        token
      })
      .then((res) => {
        setCache(res.class || []);
        setList(res.class || []);
      })
  }, [])
  const onSearch = (v) => {
    console.log(333, v)
    if (!v) {
      setList(cache);
      return;
    }
    // const res = findNestedValue(cache, v);
    // console.log(3335, res)
    // setList(res);
    let _res = [];
    let res = []
    cache.forEach((item, idx) => {
      _res.push({...item, classes: []});
      console.log(333555, JSON.stringify(_res))
      item.classes.forEach((i, idx2) => {
        _res[idx].classes.push({...i, tests: []});
        i.tests.forEach(ii => {
          if (ii.tid == v) {
            _res[idx].classes[idx2].tests.push({...ii})
            res = JSON.parse(JSON.stringify(_res))
            console.log(3335, res)
            setList(res);
          }
        })
      })
    })
  }
  return (
    <div>
      <div style={{padding: '20px'}}>
        <Search placeholder="input search text" onSearch={onSearch} enterButton />
      </div>
      
      {
        list.map(item => (
          <div style={{padding: '20px', fontSize: 22}}>
            <div key={item.grade}>{item.grade}</div>
            {
              item.classes.map((i, idx) => (
                <div key={idx} style={{padding: '20px'}}>
                  <Card title={i.name} style={{ width: '100%', height: '300px' }}>
                    <Flex wrap gap="small">
                      {
                        i.tests.map(ii => (
                          <Image
                            style={{ cursor: 'pointer', border: '1px solid #eee'}}
                            key={ii.tid}
                            width={300}
                            preview={false}
                            onClick={() => {
                              navigate('/math?taskid=' + ii.tid)
                            }}
                            src={ii.img}
                          />

                        ))
                      }
                    </Flex>
                  </Card>

                </div>

              ))
            }
          </div>
        ))
      }
    </div>

  )
}
