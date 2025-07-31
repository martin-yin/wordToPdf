import fs from 'fs';
import path from 'path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 获取当前文件的目录路径（ESM模式下的__dirname替代方案）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载地址数据
const pcaData = JSON.parse(fs.readFileSync(path.join(__dirname, '../pca-code.json'), 'utf8'));

// 数字转中文大写函数
export function numberToChinese(num) {
  if (!num || isNaN(num)) return '';
  
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟'];
  const bigUnits = ['', '万', '亿'];
  
  // 处理小数部分
  const parts = num.toString().split('.');
  const integerPart = parseInt(parts[0]);
  const decimalPart = parts[1];
  
  if (integerPart === 0) {
    if (decimalPart) {
      let result = '';
      if (decimalPart.length >= 1) {
        result += digits[parseInt(decimalPart[0])] + '角';
      }
      if (decimalPart.length >= 2) {
        result += digits[parseInt(decimalPart[1])] + '分';
      }
      return result || '零元';
    }
    return '零元';
  }
  
  let result = '';
  let numStr = integerPart.toString();
  let len = numStr.length;
  
  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr[i]);
    const pos = len - i - 1;
    
    if (digit !== 0) {
      result += digits[digit] + units[pos % 4];
      if (pos >= 4 && pos % 4 === 0) {
        result += bigUnits[Math.floor(pos / 4)];
      }
    } else if (result && !result.endsWith('零')) {
      result += '零';
    }
  }
  
  // 处理万和亿
  if (len > 4) {
    const wanPos = len - 4;
    if (wanPos > 0 && wanPos <= 4) {
      result = result.replace(/零+万/, '万');
    }
  }
  
  result += '元';
  
  // 处理小数部分
  if (decimalPart) {
    if (decimalPart.length >= 1 && decimalPart[0] !== '0') {
      result += digits[parseInt(decimalPart[0])] + '角';
    }
    if (decimalPart.length >= 2 && decimalPart[1] !== '0') {
      result += digits[parseInt(decimalPart[1])] + '分';
    }
  } else {
    result += '整';
  }
  
  return result;
}


// 日志工具函数
export function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
}


// 地址编码转换函数
export function getLocationName(code, type = 'all') {
  if (!code) return '';
  
  // 查找省份
  for (const province of pcaData) {
    if (province.code === code) {
      return province.name;
    }
    
    // 查找城市
    if (province.children) {
      for (const city of province.children) {
        if (city.code === code) {
          return type === 'all' ? `${province.name} ${city.name}` : city.name;
        }
        
        // 查找区县
        if (city.children) {
          for (const county of city.children) {
            if (county.code === code) {
              return type === 'all' ? `${province.name} ${city.name} ${county.name}` : county.name;
            }
          }
        }
      }
    }
  }
  
  return code; // 如果找不到，返回原编码
}

// 根据省市区编码获取完整地址
export function getFullAddress(provinceCode, cityCode, countyCode) {
  const parts = [];
  
  if (provinceCode) {
    const provinceName = getLocationName(provinceCode, 'single');
    if (provinceName && provinceName !== provinceCode) {
      parts.push(provinceName);
    }
  }
  
  if (cityCode) {
    const cityName = getLocationName(cityCode, 'single');
    if (cityName && cityName !== cityCode) {
      parts.push(cityName);
    }
  }
  
  if (countyCode) {
    const countyName = getLocationName(countyCode, 'single');
    if (countyName && countyName !== countyCode) {
      parts.push(countyName);
    }
  }
  
  return parts.join(' ');
}


export function generatePDF(studentData) {
  return new Promise((resolve, reject) => {
    try {
      // 读取模板文件
      const templatePath = path.join(__dirname, '../template_word.docx');
      const content = fs.readFileSync(templatePath, 'binary');

      // 创建PizZip实例并加载文档
      const zip = new PizZip(content);

      // 创建docxtemplater实例
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // 准备模板数据
      const templateData = {
        name: studentData.name || '',
        age: studentData.age || '',
        gender: studentData.gender || '',
        phone: studentData.phone || '',
        location_province: getLocationName(studentData.location_province, 'single') || '',
        location_city: getLocationName(studentData.location_city, 'single') || '',
        location_county: getLocationName(studentData.location_county, 'single') || '',
        hobby: studentData.hobby || '',
        current_level: studentData.current_level || '',
        art_subject: studentData.art_subject || '',
        learning_goal: studentData.learning_goal || '',
        teaching_method: studentData.teaching_method === '一对一' ? '✔一对一 □一对多' : '□一对一 ☑一对多',
        teaching_time: studentData.teaching_time === '线下课' ? ' ✔线下课 □线上课' : ' □线下课 ✔线上课',
        learning_time: (() => {
          const options = {
            '50课时(1.5年)': `50`,
            '100课时(3年)': `100`,
            '200课时(1.5年)': `200`,
          }
          return options[studentData.learning_time]
        })(),
        learning_year: (() => {
          const options = {
            '50课时(1.5年)': `1.5`,
            '100课时(3年)': `3`,
            '200课时(1.5年)': `5`,
          }
          return options[studentData.learning_time]
        })(), 
        instrument_deposit: studentData.instrument_deposit === '需要押金' ? ' ✔需要押金\n□无需押金' : ' □需要押金\n✔无需押金',
        pay_method: (() => {
          const payMethods = {
            '微信': '✔微信 □支付宝 □银行转账',
            '支付宝': '□微信 ✔支付宝 □银行转账',
            '银行转账': '□微信 □支付宝 ✔银行转账'
          };
          return payMethods[studentData.pay_method] || '□微信 □支付宝 □银行转账';
        })(),
        amount: studentData.amount || '',
        amount_in_words: studentData.amount ? numberToChinese(studentData.amount) : '',
        public_welfare_teacher: studentData.public_welfare_teacher || '',
        from_institution: studentData.from_institution || '',
        lesson_fee_with_instrument: studentData.lesson_fee_with_instrument || '',
        lesson_fee_without_instrument: studentData.lesson_fee_without_instrument || '',
      };

      // 渲染文档
      doc.render(templateData);
      
      // 生成Word文档缓冲区
      const buf = doc.getZip().generate({ type: 'nodebuffer' });
      
      // 创建临时文件
      const timestamp = Date.now();
      const tempDocxPath = path.join(__dirname, `temp_${timestamp}.docx`);
      const tempPdfPath = path.join(__dirname, `temp_${timestamp}.pdf`);
      
      // 写入临时Word文件
      fs.writeFileSync(tempDocxPath, buf);
      
      // 使用soffice命令转换为PDF
      const command = `soffice --headless --convert-to pdf --outdir "${__dirname}" "${tempDocxPath}"`;
      
      exec(command, (error, stdout, stderr) => {
        // 清理临时Word文件
        if (fs.existsSync(tempDocxPath)) {
          fs.unlinkSync(tempDocxPath);
        }
        
        if (error) {
          reject(new Error('PDF转换失败: ' + error.message));
          return;
        }
        
        // 检查PDF文件是否生成成功
        if (fs.existsSync(tempPdfPath)) {
          // 读取PDF文件
          const pdfBuffer = fs.readFileSync(tempPdfPath);
          
          // 清理临时PDF文件
          fs.unlinkSync(tempPdfPath);
          
          resolve(pdfBuffer);
        } else {
          reject(new Error('PDF文件生成失败'));
        }
      });
      
    } catch (error) {
      reject(new Error('生成PDF时出错: ' + error.message));
    }
  });
}