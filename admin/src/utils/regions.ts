import pcaData from '@/assets/pca-code.json'

// 省市县数据接口
export interface Region {
  code: string
  name: string
  children?: Region[]
}

// 导出省份数据
export const provinces: Region[] = pcaData.map(item => ({
  code: item.code,
  name: item.name
}))

// 根据省份代码获取城市列表
export function getCitiesByProvince(provinceCode: string): Region[] {
  const province = pcaData.find(item => item.code === provinceCode)
  if (!province || !province.children) return []

  return province.children.map(city => ({
    code: city.code,
    name: city.name
  }))
}

// 根据城市代码获取区县列表
export function getCountiesByCity(cityCode: string): Region[] {
  for (const province of pcaData) {
    if (province.children) {
      const city = province.children.find(item => item.code === cityCode)
      if (city && city.children) {
        return city.children.map(county => ({
          code: county.code,
          name: county.name
        }))
      }
    }
  }
  return []
}

// 根据代码获取名称
export function getNameByCode(code: string): string {
  // 查找省份
  const province = pcaData.find(item => item.code === code)
  if (province) return province.name

  // 查找城市
  for (const province of pcaData) {
    if (province.children) {
      const city = province.children.find(item => item.code === code)
      if (city) return city.name

      // 查找区县
      for (const city of province.children) {
        if (city.children) {
          const county = city.children.find(item => item.code === code)
          if (county) return county.name
        }
      }
    }
  }

  return ''
}
