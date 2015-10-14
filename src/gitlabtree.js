
// 全局变量
var private_token,
    project_id,
    repository_ref,
    apiRepoTree,
    path_with_namespace,
    repoName,
    apiProjects,
    originUrl,
    $jstree;

window.addEventListener("load", myMain, false);

function myMain(evt) {
    $(function() {
        if ($('head script[type="text/javascript"]').contents()[0]) {

            createBtn();

            showSpinner();

            private_token = getPrivateToken($('head script[type="text/javascript"]').contents()[0]['wholeText']);

            initVariables();

            // 1. 获取所需变量
            $.get(apiProjects, {
                private_token: private_token
            }, function(repos) {
                for (var key in repos) {
                    var objRepoInfo = repos[key];
                    var path;
                    if (objRepoInfo.id == project_id) {

                        path = objRepoInfo.path;
                        repoName = objRepoInfo.name;
                        path_with_namespace = objRepoInfo.path_with_namespace;
                    }
                }
                console.log('request apiRepoTree: ' + apiRepoTree);

                if (!path_with_namespace) {
                    console.log('如果path_with_namespace没拿到，再拿一遍');
                    path_with_namespace = $('.home a').attr('href');
                    var firstChar = path_with_namespace.substring(0,1);
                    if (firstChar && firstChar === '/') {
                        path_with_namespace = path_with_namespace.substr(1);
                    }
                }

                // 2. 获取repo代码目录结构
                $.get(apiRepoTree, {
                    private_token: private_token,
                    id: project_id,
                    // path: path,
                    ref_name: repository_ref
                }, function(result) {
                    hideSpinner();

                    if (isFilesTab()) {

                        createGitlabTreeContainer();

                        createGitlabTree(result);

                        selectNode();

                        hackStyle();

                        handlePJAX();

                        handleToggleBtn();
                    }

                });
            });
        }
    });
}

// 获取private_token
function getPrivateToken(strXml) {
    var arrXmlNode = strXml.toString().split(';')
    var private_token;
    var objXml = {};
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
        console.log('token获取失败');
        return;
    }

    return private_token;
}

function initVariables() {
    project_id = $('#project_id').val();
    repository_ref = $('#repository_ref').val();

    // var repoName,
    originUrl = window.location.origin;

    var apiRootUrl = originUrl + '/api/v3/projects/';
    apiProjects = apiRootUrl;
    apiRepoTree = apiRootUrl + project_id + '/repository/tree';
    var apiFileContent = apiRootUrl + project_id + '/repository/files';

    localStorage.removeItem('loadedDirs');
}

// 处理右侧gitlab的宽度
function hackStyle() {
    if (location.href.indexOf('gitlab.com') > -1) {
        $('.sidebar-wrapper').hide();
        $('.gitlab-tree').css('width', '230px');
        $('header.navbar').css('margin-left', '230px');
    } else {
        hideGitlabTree();
        $('body').css('overflow', 'hidden');
    }
}

function handlePJAX() {

    if ($.support.pjax) {
        $(document).on('pjax:complete', function() {
            $('pre code').each(function(i, block) {
                hljs.highlightBlock(block);
            });
        });

        $(document).on('pjax:start', function() {
            NProgress.start();
            showLoading();
        });
        $(document).on('pjax:end', function() {
            NProgress.done();
            hideLoading();
        });
    }
}

// 暂时没用到
function clickTagA(data) {
    $('.gitlab-tree nav a').off('click').on('click', function(event) {
        var $target = $(event.target);
        
        if ($target.find('i').hasClass('fa fa-file-o') === true) {
            console.log('click a file');
            event.preventDefault();
            event.stopPropagation();
        }
    });
}

// 判断当前是否是Files Tab
function isFilesTab() {
    var currentTabText = $('.project-navigation li.active a').text();

    if (currentTabText === 'Files' || $('.nav.nav-sidebar li.active a').text().trim() === 'Files') {
        return true;
    }
    return false;
}


// path = "java/main/src/"
//    --> "src/main/java"
function revertPath(revertedPathString) {
    var retString = '';
    var arrString = revertedPathString.split('/');
    
    // 1 删除空元素
    arrString.forEach(function(item, index){
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
function removeElement(index, array) {
    if (index >= 0 && index < array.length) {
        for (var i = index; i < array.length; i++) {
            array[i] = array[i + 1];
        }
        array.length = array.length - 1;
    }
    return array;
}

function createGitlabTreeContainer() {
    // 创建一个container
    var htmlTemplate = '<div class="gitlab-tree">\
                            <header>\
                                <div class="head">\
                                    <div class="info">
                                        <i class="fa fa-lock"></i><a href="/groups/mobile" target="_blank"></a> / <span></span>\
                                    </div>\
                                    <i class="fa fa-code-fork"></i><span class="branch"></span>\
                                    <a class="gitlabtree_toggle toggle-btn icon-white icon-arraw-left toggle-btn-color">
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

function createGitlabTree(result) {
    // 构建一颗子树
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
    });
}

// 监听tree node 事件
function selectNode() {
    $jstree.on("select_node.jstree", function(e, data) {
        var selectNode = $jstree.jstree('get_selected');
        console.log('select_node.jstree');
        if (data && data.node && data.node.data == 'tree') {
            var path = data.node.text;
            var currentNodeId = data.node.id;
            var parentNode = $jstree.jstree(true).get_parent(currentNodeId);

            // 获取select节点+ 父节点的text
            var currentNodeText = data.node.text;
            var arrParents = data.node.parents;

            path = currentNodeText + '/';

            // 获取当前select节点+所有父节点的text  ["j1_13", "j1_3", "#"]
            arrParents.forEach(function(item){
                if (item !== '#') {
                    var tmpText = $jstree.jstree(true).get_text(item);
                    path += tmpText + '/';
                }
            });

            // path = "java/main/src/"
            path = revertPath(path);

            // 如果已经加载过了，就不要重复加载了
            var arrClickedDir = localStorage.getItem('loadedDirs');
            if (arrClickedDir) {
                arrClickedDir = arrClickedDir.split(',');
            }

            if (arrClickedDir && arrClickedDir.indexOf(path) > -1) {
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
                    $jstree.jstree(true).create_node(selectNode, item, 'last');
                });
                
                // $(".gitlab-tree nav").jstree(true).open_all();
                // $(".gitlab-tree nav").jstree(true).close_all();
                $jstree.jstree(true).open_node(selectNode);

            });
        } else { // blob

            var href = getClickedFileFullPath(data);

            // fix pjax link.href can't contains '#'
            var snode = $jstree.jstree(true).get_node(selectNode, true);
            $(snode.find('a'))[0].href = href;
            
            $(document).pjax('.gitlab-tree nav a.jstree-clicked', '#tree-content-holder', {fragment:'#tree-content-holder', timeout:9000});
        }
    });
}

function getClickedFileFullPath(data) {
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

    return href;
}

function handleToggleBtn() {
    $('.gitlab-tree header a.toggle-btn').on('click', function() {
        hideGitlabTree();
        createBtn();
    });
}

function createBtn() {
    if ($('.open-tree').length === 0) {
        var htmlTemplate = '<div class="open-tree fa fa-angle-right"></div>';
        $('body').append(htmlTemplate);  

        $('.open-tree').on('click', function() {
            showGitlabTree();
        });  
    } else {
        $('.open-tree').show();
    }
}

function hideGitlabTree() {
    $('.gitlab-tree').hide();
    updateLayoutUI('hide');
}

function showGitlabTree() {
    $('.gitlab-tree').show();
    updateLayoutUI('show');
}

function updateLayoutUI(operateType) {
    var screenWidth = window.innerWidth;

    if (operateType === 'hide') {
        if (screenWidth < 768) {
            $('.container').css('padding-left', '0');
        } else {
            $('.container').css('padding-left', '0');
        }
    } else {
        if (screenWidth < 1000) {
            $('.container').css('padding-left', '300px');
        } else {
            $('.container').css('padding-left', '0');
        }
    }
}


function showLoading() {
    $('.loader').show();
    $('.toggle-btn').removeClass('toggle-btn-color');
}

function hideLoading() {
    $('.loader').hide();
    $('.toggle-btn').addClass('toggle-btn-color');
}

function showSpinner() {
    $('.open-tree')
        .removeClass('fa fa-angle-right')
        .addClass('busy')
        .append('<i class="fa fa-spinner fa-spin"></i>');
}

function hideSpinner() {
    $('.open-tree')
        .addClass('fa fa-angle-right')
        .removeClass('busy');
    $('.open-tree i').removeClass('fa fa-spinner fa-spin');
}


