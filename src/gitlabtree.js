/*
 * @Author: fanyong@gmail.com
 * @Date:   2015-10-20
 * @Last Modified by:  FrankFan
 */

var GitlabTree = (function($, win) {
  // 全局变量
  var private_token,
    project_id,
    repository_ref,
    apiRepoTree,
    apiFileContent,
    path_with_namespace,
    apiProjects,
    originUrl,
    initContainerML,
    $jstree;

  var getPrivateToken = function(dtd) {
    var arrXmlNode;
    var objXml = {};
    var wholeText;

    if ($('head script[type="text/javascript"]').contents()[0]) {
      wholeText = $('head script[type="text/javascript"]').contents()[0]['wholeText'];
    }

    if (wholeText) {
      if (!/window.gon/ig.test(wholeText)) {
        return;
      }
    } else {
      if ($('head script').contents()[0]) {
        wholeText = $('head script').contents()[0]['wholeText'];
      }

      if (!wholeText) {
        return;
      } else {
        if (!/window.gon/ig.test(wholeText)) {
          return;
        }
      }
    }

    if ($('head script[type="text/javascript"]').contents()[0]) {
      arrXmlNode = wholeText.toString().split(';')
    } else {
      if ($('head script').contents()[0]) {
        arrXmlNode = wholeText.toString().split(';')
      } else {
        return false;
      }
    }

    for (var i = 1; i < arrXmlNode.length - 1; i++) {
      var item = arrXmlNode[i].split('=');
      var key = item[0];
      var value = item[1];
      objXml[key] = value;
    }
    for (var key in objXml) {
      if (key === 'gon.api_token') {
        private_token = objXml[key];
      }
    }

    if (private_token) {
      private_token = private_token.replace(/\"/g, '');
    } else {
      tryToGetTokenInGitlab9(function(result) {
        if (result && result != 401) {
          private_token = result;
          dtd.resolve(true);
        } else {
          quit();
          dtd.reject(false);
        }
      });
    }
  }

  var tryToGetTokenInGitlab9 = function(callback) {
    $.ajax(window.location.origin + '/profile/account')
      .then(function(data, status) {
        private_token = data && $(data).find('#private-token').val();
        if (private_token) {
          callback && callback(private_token);
        } else {
          console.log('private_token not found.');
        }
      })
      .fail(function(err) {
        if (err.status && err.status === 401) {
          console.log('没有登录');
          callback && callback(err.status);
          return;
        }
      });
  }

  var initVariables = function() {
    project_id = $('#project_id').val() || $('#search_project_id').val();
    repository_ref = $('#repository_ref').val();
    originUrl = window.location.origin;

    var apiRootUrl = originUrl + '/api/v3/projects/';
    apiProjects = apiRootUrl;
    apiRepoTree = apiRootUrl + project_id + '/repository/tree';
    apiFileContent = apiRootUrl + project_id + '/repository/files/';

    var tmpClassName = $('.container').length > 0 ? '.container' : '.content-wrapper .container-fluid';
    initContainerML = $(tmpClassName).offset() && $(tmpClassName).offset().left;
    console.log('initContainerML = ' + initContainerML);
  }

  var generateDisplayNodes = function(serverResult) {
    var nodesDisplay = [];
    serverResult.forEach(function(item) {
      var singleObj = {};
      singleObj.text = item.name;
      if (item.type === 'tree') {
        singleObj.children = [];
        singleObj.data = 'tree';
        singleObj.icon = 'fa fa-folder';
      } else if (item.type === 'blob') {
        singleObj.icon = 'fa fa-file-o';
        singleObj.data = 'blob';
      }
      nodesDisplay.push(singleObj);
    });
    return nodesDisplay;
  }

  var getLocalStorageData = function() {
    var strClickedDir = localStorage.getItem('loadedDirs');
    var lastElement;
    var arrClickedDir = strClickedDir && strClickedDir.split(',') || [];
    if (arrClickedDir.length > 0) {
      lastElement = arrClickedDir[arrClickedDir.length - 1] || '';
    }
    return {
      lastElement: lastElement,
      arrAllLoadedDirs: arrClickedDir,
    }
  }

  var getResultJson = function(path) {
    var promise = new Promise(function(resolve, reject) {
      $.get(apiRepoTree, {
        private_token: private_token,
        id: project_id,
        path: path,
        ref_name: repository_ref
      }, function(result) {
        resolve(result);
      });
    });
    return promise;   
  }

  var createNodeById = function(nodesDisplay, nodeid) {
    var cnode = $jstree.jstree(true).get_node(nodeid);
    nodesDisplay.forEach(function(item) {
      var newNodeObj = $jstree.jstree(true).create_node(cnode, item, 'last', function(data) {
        // console.log('new node created.');
        // console.log(data);
      });
      $jstree.jstree(true).open_node(cnode);
    });
    // TODO add class
    // jstree-wholerow jstree-wholerow-hovered
    // jstree-wholerow jstree-wholerow-clicked
  }

    // 转换
    // src/main/webapp 
    // --------->
    // ['src', 'src/main', 'src/main/webapp']
  var makeRequestArr = function(str) {
    var arr = [];
    var arrSplited = str.split('/');
    arr.push(arrSplited[0]);
    arrSplited.reduce(function(prev, current, currentIndex){
      var tmpValue =  prev + '/' + current;
      arr.push(tmpValue);
      return tmpValue;
    });
    return arr;
  }

  var handleRefresh = function() {
    var requestPath = [];
    var lastElement = getLocalStorageData().lastElement;
    requestPath = lastElement && makeRequestArr(lastElement);
    var promises = requestPath.map(function(path) {
      return getResultJson(path);
    });
    Promise.all(promises)
      .then(function(data) {
        data.forEach(function(item, index) {
          var nodesDisplay = generateDisplayNodes(item);
          if (index === 0) {
            $('.jstree .jstree-container-ul').find('li a').each(function (index, item) {
              var text = $(item).text().trim();
              if(text === requestPath[0]) {
                var nodeid = $(this).parent().attr('id');
                createNodeById(nodesDisplay, nodeid);
              }
            });
          } else {
            $('.jstree .jstree-container-ul li.jstree-open ul li').each(function (index, element) {
              var text = $(element).text().trim();
              var nodeid = element.id;
              if(lastElement.split('/').indexOf(text) > -1) {
                createNodeById(nodesDisplay, nodeid);
              }
            });
          }
        });
      })
      .catch(function(err) {
        console.error(err);
      });

    // 打开面板
    showGitlabTree();
  }
  
  // 处理右侧gitlab的宽度
  var hackStyle = function() {
    if (location.href.indexOf('gitlab.com') > -1) {
      $('.sidebar-wrapper').hide();
      $('.gitlab-tree').css('width', '230px');
      $('header.navbar').css('margin-left', '230px');
    } else {
      hideGitlabTree();
      $('body').css('overflow', 'hidden');
    }

    $('.breadcrumb').addClass('vh');
  }

  var handlePJAX = function() {
    console.log('pjax:complete');
    if ($.support.pjax) {
      // $(document).on('pjax:complete', function() {
      //   $('pre code').each(function(i, block) {
      //     hljs.highlightBlock(block);
      //   });
      // });

      $(document).on('pjax:start', function() {
        NProgress.start();
        showLoading();
      });
      $(document).on('pjax:end', function() {
        NProgress.done();
        hideLoading();

        // TODO: 这里无法高亮代码，需要优化
        $('pre code').each(function(i, block) {
          hljs.highlightBlock(block);
        });
      });
    }
  }

  // 判断当前是否是Files Tab
  var isFilesTab = function() {
    var currentTabText = $('.project-navigation li.active a').text();
    if (currentTabText === 'Files' || $('.nav.nav-sidebar li.active a').text().trim() === 'Files') {
      return true;
    }

    // gitlab 9.x
    var currentTabText2 = $('.nav-links.sub-nav li.active a').text().trim();
    if (currentTabText2 === 'Files') {
      return true;
    }

    return false;
  }

  // path = "java/main/src/"
  //    --> "src/main/java"
  var revertPath = function(revertedPathString) {
    var retString = '';
    var arrString = revertedPathString.split('/');

    // 1 删除空元素
    arrString.forEach(function(item, index) {
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
  var removeElement = function(index, array) {
    if (index >= 0 && index < array.length) {
      for (var i = index; i < array.length; i++) {
        array[i] = array[i + 1];
      }
      array.length = array.length - 1;
    }
    return array;
  }

  var createGitlabTreeContainer = function() {
    // 创建一个container
    var htmlTemplate = '<div class="gitlab-tree" style="display: none;">\
                                <header>\
                                    <div class="head">\
                                        <div class="info">\
                                            <i class="fa fa-lock"></i><a href="/groups/mobile" target="_blank"></a> / <span></span>\
                                        </div>\
                                        <i class="fa fa-code-fork"></i><span class="branch"></span>\
                                        <a class="gitlabtree_toggle toggle-btn icon-white icon-arraw-left toggle-btn-color">\
                                            <div class="loader icon-loading" style="display: none;"></div>\
                                        </a>\
                                    </div>\
                                </header>';
    htmlTemplate += '<nav></nav></div>';
    $('body').append(htmlTemplate);

    $('.gitlab-tree div.info a').text(path_with_namespace.split('/')[0]);
    $('.gitlab-tree div.info span').text(path_with_namespace.split('/')[1]);
    $('.gitlab-tree span.branch').text(repository_ref);
  }

  // 构建一颗子树
  var createGitlabTree = function(result) {
    var subTreeData = [];
    result.forEach(function(item) {
      var singleObj = {};
      singleObj.text = item.name;
      if (item.type === 'tree') {
        singleObj.children = [];
        singleObj.data = 'tree';
        singleObj.icon = 'fa fa-folder';
      } else if (item.type === 'blob') {
        singleObj.icon = 'fa fa-file-o';
        singleObj.data = 'blob';
      }
      subTreeData.push(singleObj);
    });

    // 实例化一棵树
    $jstree = $('.gitlab-tree nav').jstree({
      'core': {
        'data': subTreeData,
        'check_callback': true
      },
      plugins: ['wholerow']
    })
    .on('ready.jstree', function(event, data) {
      console.log(' ... jstree is ready ...');
      handleRefresh();
    });
  }

  // 监听tree node 事件
  var clickNode = function() {
    $jstree.on("select_node.jstree", function(e, data) {
      var selectNode = $jstree.jstree('get_selected');
      if (data && data.node && data.node.data == 'tree') {
        var path = data.node.text;
        var currentNodeId = data.node.id;
        var parentNode = $jstree.jstree(true).get_parent(currentNodeId);

        // 获取select节点+ 父节点的text
        var currentNodeText = data.node.text;
        var arrParents = data.node.parents;

        path = currentNodeText + '/';

        // 获取当前select节点+所有父节点的text  ["j1_13", "j1_3", "#"]
        arrParents.forEach(function(item) {
          if (item !== '#') {
            var tmpText = $jstree.jstree(true).get_text(item);
            path += tmpText + '/';
          }
        });

        // path = "java/main/src/"
        path = revertPath(path);

        var arrClickedDir = localStorage.getItem('loadedDirs');
        if (arrClickedDir) {
          arrClickedDir = arrClickedDir.split(',');
        }
        // 如果已经加载过了，就不要重复加载了
        if (arrClickedDir && (arrClickedDir[arrClickedDir.length - 1] === path)) {
          console.log('loaded the same path, abort');
          return;
        }

        // 获取子目录结构
        $.get(apiRepoTree, {
          private_token: private_token,
          id: project_id,
          path: path,
          ref_name: repository_ref
        }, function(result) {
          var arrClickedDir = localStorage.getItem('loadedDirs');
          if (arrClickedDir) {
            arrClickedDir = arrClickedDir.split(',');
            arrClickedDir.push(path);
          }

          if (arrClickedDir && Array.isArray(arrClickedDir)) {
            localStorage.setItem('loadedDirs', arrClickedDir.join(','));
          } else {
            localStorage.setItem('loadedDirs', path);
          }

          var nodesDisplay = [];
          result.forEach(function(item) {
            var singleObj = {};
            singleObj.text = item.name;

            if (item.type === 'tree') {
              singleObj.children = [];
              singleObj.data = 'tree';
              singleObj.icon = 'fa fa-folder';
            } else if (item.type === 'blob') {
              singleObj.icon = 'fa fa-file-o';
              singleObj.data = 'blob';
            }

            nodesDisplay.push(singleObj);
          });

          nodesDisplay.forEach(function(item) {
            var ids = $jstree.jstree(true).create_node(selectNode, item, 'last');
          });

          // $(".gitlab-tree nav").jstree(true).open_all();
          // $(".gitlab-tree nav").jstree(true).close_all();
          $jstree.jstree(true).open_node(selectNode);
        });
      } else { // blob

        var href = getClickedPath(data).fullPath;
        var filePath = getClickedPath(data).filePath;
        
        var arrClickedDir = localStorage.getItem('loadedDirs');
        if (arrClickedDir) {
          arrClickedDir = arrClickedDir.split(',');
          
          // 如果已经加载过了，就不要重复加载了
          if (arrClickedDir && (arrClickedDir[arrClickedDir.length - 1] === filePath)) {
            console.log('loaded the same path, abort');
            return;
          }

          if (arrClickedDir.indexOf(filePath) < 0) {
            arrClickedDir.push(filePath);
          }
        }        

        if (arrClickedDir && Array.isArray(arrClickedDir)) {
          localStorage.setItem('loadedDirs', arrClickedDir.join(','));
        } else {
          localStorage.setItem('loadedDirs', filePath);
        }

        window.location.href = href;

        // 暂时注释：Gitlab9.x无法使用pjax方式无刷新打开code file,将
        // if ($('#blob-content-holder').length > 0) {
        //   // 只能这样写否则就不work了……
        //   $(document).pjax('.gitlab-tree nav a.jstree-clicked', '#blob-content-holder', {
        //     fragment: '#blob-content-holder',
        //     container: '#blob-content-holder',
        //     timeout: 650,
        //     url: href,
        //   });
        // }
        // else if ($('.blob-content-holder').length > 0) {
        //   console.log(3);
        //   $(document).pjax('.gitlab-tree nav a.jstree-clicked', '.file-holder', {
        //     fragment: '.file-holder',
        //     timeout: 9000
        //   });
        // }
        // ----- Comment End
      }
    });

    // handle open node state
    openCloseNode();
  }

  var openCloseNode = function() {
    $jstree.on("before_open.jstree", function(e, data) {
      showLoading();
    });

    $jstree.on("after_open.jstree", function(e, data) {
      hideLoading();
    });
  }

  var getClickedPath = function(data) {
    var path = data.node.text + '/';
    var arrParents = data.node.parents;

    // data.node.parents ["j1_13", "j1_3", "#"]
    arrParents.forEach(function(item) {
      if (item !== '#') {
        var tmpText = $jstree.jstree(true).get_text(item);
        path += tmpText + '/';
      }
    });

    path = revertPath(path);

    // http://gitlab.xxx.cn /   mobile/m-web           /blob/   master            /     src/main/webapp/resource/loader.js
    var href = originUrl + '/' + path_with_namespace + '/blob/' + repository_ref + '/' + path;

    return {
      filePath: path,
      fullPath: href,
    };
  }

  var handleToggleBtn = function() {
    $('.gitlab-tree header a.toggle-btn').on('click', function() {
      hideGitlabTree();
      createBtn();
    });
  }

  var createBtn = function() {
    if ($('.open-tree').length === 0) {
      var htmlTemplate = '<div class="open-tree fa fa-angle-right"></div>';
      if (isFilesTab()) {
        $('body').append(htmlTemplate);
      }

      $('.open-tree').on('click', function() {
        showGitlabTree();
      });
    } else {
      if (isFilesTab()) {
        $('.open-tree').show();
      }
    }
  }

  var hideGitlabTree = function() {
    $('.gitlab-tree').hide('fast');
    updateLayoutUI('hide');
  }

  var showGitlabTree = function() {
    $('.gitlab-tree').show('fast');
    updateLayoutUI('show');
  }

  var updateLayoutUI = function(operateType) {
    var tmpClassName = $('.container').length > 0 ? '.container' : '.content-wrapper .container-fluid';
    var currentContainerML = $(tmpClassName).offset() && $(tmpClassName).offset().left;
    console.log('updateLayoutUI->initContainerML = ' + initContainerML);
    if (operateType === 'hide') {
      if (+currentContainerML > +initContainerML) {
        $(tmpClassName).offset({left: initContainerML});
      }
    } else {
      $(tmpClassName).offset({left: 300})
    }
  }

  // 显示tree里面的loading
  var showLoading = function() {
    $('.loader').show();
    $('.toggle-btn').removeClass('toggle-btn-color');
  }

  var hideLoading = function() {
    $('.loader').hide();
    $('.toggle-btn').addClass('toggle-btn-color');
  }

  // 显示tree外面的loading
  var showSpinner = function() {
    $('.open-tree')
      .removeClass('fa fa-angle-right')
      .addClass('busy')
      .append('<i class="fa fa-spinner fa-spin"></i>');
  }

  var hideSpinner = function() {
    $('.open-tree')
      .addClass('fa fa-angle-right')
      .removeClass('busy');
    $('.open-tree i').removeClass('fa fa-spinner fa-spin');
  }

  var checkRepos = function(repos) {
    var result = true;

    if (repos && repos.length > 0) {
      for (var key in repos) {
        var objRepoInfo = repos[key];
        var path;
        if (objRepoInfo.id == project_id) {
          path = objRepoInfo.path;
          repoName = objRepoInfo.name;
          path_with_namespace = objRepoInfo.path_with_namespace;
        }
      }

      // gitlab 9.x
      if (!path_with_namespace) {
        path_with_namespace = $('header .header-content .title a.project-item-select-holder').attr('href');
        var firstChar = path_with_namespace && path_with_namespace.substring(0, 1);
        if (firstChar && firstChar === '/') {
          path_with_namespace = path_with_namespace.substr(1);
        }
      }

      // gitlab 8.x
      if (!path_with_namespace) {
        path_with_namespace = $('.home a').attr('href');
        var firstChar = path_with_namespace && path_with_namespace.substring(0, 1);
        if (firstChar && firstChar === '/') {
          path_with_namespace = path_with_namespace.substr(1);
        }
      }

      if (!path_with_namespace) {
        quit();
        result = false;
      }

      if (!repository_ref) {
        quit();
        result = false;
      }
    }

    return result;
  }

  var hotkey = function() {
    $(document).keyup(function(e) {
      // 219 [
      if (e.keyCode === 219) {
        toggleSideBar();
      }
    });
  }

  var toggleSideBar = function() {
    if ($('.gitlab-tree:visible').length > 0) {
      hideGitlabTree();
    } else {
      showGitlabTree();
    }
  }

  var quit = function() {
    hideSpinner();
    $('.open-tree').hide();
  }

  var init = function(next) {
    var p = new Promise(function(resolve, reject) {
      $.Deferred(getPrivateToken)
      .done(function(status) {
        resolve(status);
        console.info("get token ", private_token);
        $(window).resize(function() {
          updateLayoutUI('show');
        });
        createBtn();
        showSpinner();
        initVariables();
      })
      .fail(function(status) {
        console.warn("出错啦！", status);
        reject(status);
      });
    });

    p.then(function(status) {
      next();
    }).catch(function(status) {
      console.error('Error ', status);
      return;
    });
  }

  var getApiProjects = function() {
    $.get(apiProjects, {
        private_token: private_token
      })
      .done(function(repos) {
        var checkResult = checkRepos(repos);
        if (checkResult == false) {
          return;
        }

        // 2. 获取repo代码目录结构
        $.get(apiRepoTree, {
            private_token: private_token,
            id: project_id,
            // path: path,
            ref_name: repository_ref
          })
          .done(function(result) {
            hideSpinner();
            if (isFilesTab()) {
              createGitlabTreeContainer();
              createGitlabTree(result);
              clickNode();
              handlePJAX();
              handleToggleBtn();
              hotkey();
              hackStyle();
            }
          });
      });
  }

  return {
    init: init,
    action: getApiProjects,
  }
})(jQuery, window);

// if exist jQuery object
if (jQuery) {
  $(function() {
    GitlabTree.init(GitlabTree.action);
  });
}
