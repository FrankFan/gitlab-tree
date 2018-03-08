var revertPath = function (revertedPathString) {
  var retString = '';
  var arrString = revertedPathString.split('/');

  // 1 删除空元素
  arrString.forEach(function (item, index) {
    if (item === '') {
      removeElement(index, arrString);
    }
  });

  // 2.倒序排列
  for (var i = arrString.length - 1; i >= 0; i--) {
    var item = arrString[i];
    retString += item + '/';
  };

  // 3.去掉最后一个/
  if (retString.substr(retString.length - 1) === '/') {
    retString = retString.substr(0, retString.length - 1);
  }

  return retString;
}

// 删除数组中指定的元素
var removeElement = function (index, array) {
  if (index >= 0 && index < array.length) {
    for (var i = index; i < array.length; i++) {
      array[i] = array[i + 1];
    }
    array.length = array.length - 1;
  }
  return array;
}

// src/main/webapp
// --------->
// ['src', 'src/main', 'src/main/webapp']
var makeRequestArr = function (str) {
  var arr = [];
  var arrSplited = str.split('/');
  arr.push(arrSplited[0]);
  arrSplited.reduce(function (prev, current, currentIndex) {
    var tmpValue = prev + '/' + current;
    arr.push(tmpValue);
    return tmpValue;
  });
  return arr;
}

module.exports = {
  revertPath,
  removeElement,
  makeRequestArr,
}
