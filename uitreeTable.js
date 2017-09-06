(function(root, factory) {
        root.TreeTable = factory();
})(this,function(){
	 //ztree结构样式片段
    var IDMark_Switch = "_switch",
        IDMark_Icon = "_ico",
        IDMark_Span = "_span",
        IDMark_Input = "_input",
        IDMark_Check = "_check",
        IDMark_Edit = "_edit",
        IDMark_Remove = "_remove",
        IDMark_Ul = "_ul",
        IDMark_A = "_a";
    //ztree配置
    var setting = {
        view: {
            addDiyDom: null,
            showLine: false,
            showIcon:false,
            selectedMulti: true
        },
        data: {
            simpleData: {
                enable:true,
                idKey: "id",//一般需要具体设置
                pIdKey: "parentId",//一般需要具体设置
                rootPId: ""
            },
            key:{
            	name:"text",//一般需要具体设置
            	checked:"isDefault",
            	url:false
        	},
        	keep:{
        		leaf:false,
        		parent:false
        	}
        },	
        callback: {
            beforeClick: function(treeId, treeNode,clickFlag) {
                if (treeNode.id === "title") {
                    return false;
                }
            },
            onClick:function(event, treeId, treeNode, clickFlag){
            },
            beforeExpand:function( treeId, treeNode){
                debugger
            },
            onExpand:function(event, treeId, treeNode){
                debugger
            },
            beforeCollapse:function(treeId, treeNode){
                debugger
            },
            onCollapse:function(event, treeId, treeNode){
                debugger
            }
        }
    };

    function TreeTable(options) {
        if (!options || typeof options !== "object") {
            options = {};
        }
        this.initSetting(setting, options);

        this.element = $("#" + this.id);
        this.element.data(this);
        this.element.addClass("ui-tree-table");
        this.element.addClass("ztree");

        if (options.autoUpdate) {
            this.update();
        }
        return this;
    }
    TreeTable.prototype = {
        constructor: TreeTable,
        _events: [],
        _attachEvents: function() {
            this._detachEvents();
            this._events = [];
            for (var i = 0, el, ev; i < this._events.length; i++) {
                el = this._events[i][0];
                ev = this._events[i][1];
                el.on(ev);
            }
            if(!this.events){
            	this.events=[];
            }
        },
        _detachEvents: function() {
            for (var i = 0, el, ev; i < this._events.length; i++) {
                el = this._events[i][0];
                ev = this._events[i][1];
                el.off(ev);
            }
            this._events = [];
        },
        initSetting: function(setting, options) {
        	for(var i in options){
        		if(i==="_events"){
        			this._events.concat(options[i]);
        			continue;
        		}
        		if(i=="tableCel"&&$.isArray(options[i])&&options[i].length>0){
        			var titleObj={
        				id:options.titleId,
        				text:options.titleText,
                        width:options.titleWidth,
                        isTitle:true
        			}
        			options[i].map(function(obj,i){
        				titleObj[obj.name]=obj.text;
        			});
        			this.titleObj=titleObj;
        		}
        		if(i!=="setting"){
        			this[i]=options[i];
        		}
        	}
            setting.view.addDiyDom=this.addDiyDom(this);
            this.setting = setting;
        },
        //获取zNodes数据
        getAjaxData: function(callback) {
            var that = this;
            $.ajax({
                type: that.type||"get",
                url: that.url,
                data:that.ajaxData||{},
                success: function(zNodes) {
                    zNodes = zNodes ? zNodes : [];
                    if(!$.isArray(zNodes)){
                    	zNodes=$.parseJSON(zNodes);
                    }
                    
                    if(that.titleObj){
                    	zNodes.unshift(that.titleObj);
                    }
                    callback.call(that,zNodes)
                },
                error: function(e) {
                    alert(String(e));
                }
            });
        },
        //格式化树节点
        formatzNodes:function(nodes){
            return nodes;
        },
        //绘制树
        createTree:function(zNodes){
            var that=this;
            if(that.formatzNodes&&typeof that.formatzNodes==="function"){
                zNodes=that.formatzNodes(zNodes);
            }
            $.fn.zTree.init($("#" + that.id), that.setting,zNodes );
            that._attachEvents();

            if(typeof that.afterUpdate==="function"){
                that.afterUpdate();
            }
        },
        //修改一个树节点（一行表格数据）
        addDiyDom:function() {
            var that=this;
            return function(treeId, treeNode){
                var tId=treeNode.tId
                var switchEle = $("#" + tId + IDMark_Switch);
                var aEle = $("#" + tId + IDMark_A);
                var iconEle = $("#" + tId + IDMark_Icon);

                var reg = /.*level(\d+).*/g;
                var level = Number(aEle.attr("class").replace(reg, "$1"));
                var indentStr = '<span class="ui-indent"></span>';//树的层级间隔
                var indentStrs = '';

                var checkWidth=that.checkWidth;
                var titleWidth=that.titleWidth||"200px";
                for (var i = 0; i < level; i++) {
                    indentStrs += indentStr;
                }

                //设置表格表头
                if (treeNode.id === that.titleId) { 
                    iconEle.remove();
                    aEle.addClass("ui-title");
                }

                //修改展开按钮结构位置
                aEle.prepend(switchEle);
                //修改原来的树控件结构，显示成树的层级间隔
                aEle.append($('<div class="ui-cel ui-name" style="width:'+titleWidth+'">' + indentStrs + '</div>').append(aEle.children()));
                //向树控件添加checkbox
                if(checkWidth){
                    aEle.prepend('<span class="ui-cel ui-check" style="width:'+checkWidth+'" title="单击时同时按下 Ctrl 键可以选中多个节点"></span>');
                }
                
                //向树控件添加其他列
                var tableCel = that.tableCel||[],oneCel,innerTreeCel,type,isTitle,node;
                for (var i = 0; i < tableCel.length; i++) {
                    isTitle=treeNode.isTitle;
                    oneCel=tableCel[i];
                    type=oneCel.type;
                    if(isTitle){//表头
                        node=that.createStringCelOfTree(oneCel, treeNode);
                    }else if(type==="operate"){//操作类型
                        node = that.creatOperateCelOfTree(oneCel, treeNode);
                    }else if(type==="tree"){//树类型
                        innerTreeCel=tableCel.slice(i+1);
                        node=that.createTreeCelOfTree(oneCel, treeNode,innerTreeCel,tId);
                    }else{//字符串类型（其他类型）
                        node=that.createStringCelOfTree(oneCel, treeNode);
                    }
                    aEle.append(node);
                    if(!isTitle&&type==="tree"){
                        return;
                    }
                }
            };
        },
        //构造string类型单元格
        createStringCelOfTree:function(celObj, treeNode){
            var type=celObj.type,//列类型
                name = celObj.name,//列名
                text=celObj.text,//列头显示文字
                width = celObj.width||"100px",//列宽度
                blankText=celObj.blankText,//没有数据时，内容显示空白数据
                param=celObj.param||{};//根据不同的列类型type会有不同的参数
             //读取接口数据
            var nodeVal = treeNode[name];
            if (nodeVal === undefined) {//接口返回没有数据时的处理
                if(blankText===undefined){
                    nodeVal = "";
                }else{
                    nodeVal = blankText;
                }
            }
            var ele = $('<span class="ui-cel" style="width:' + width + '" title="'+nodeVal+'">' + nodeVal + '</span>');
            return ele;
        },
        //构造树类型单元格
        createTreeCelOfTree:function(celObj, treeNode,innerTreeCel,tId){
            var type=celObj.type,//列类型
                name = celObj.name,//列名
                text=celObj.text,//列头显示文字
                width = celObj.width||"100px",//列宽度
                blankText=celObj.blankText,//没有数据时，内容显示空白数据
                param=celObj.param||{};//根据不同的列类型type会有不同的参数
            var id=tId+"_"+name;
             //读取接口数据
            var nodeVal = treeNode[name];
            var ele;
            //计算宽度
            var reg=/[^\d]*$/;
            var unit=width.replace(/[\d\.]*/g,"");
            var tableCel=[],initW=Number(width.replace(reg,"")),totalW=initW;
            (function(){
                var obj,w
                for(var i=0;i<innerTreeCel.length;i++){
                    obj=$.extend({},innerTreeCel[i]);
                    w=obj.width.replace(reg,"");
                    totalW+=Number(w);
                    tableCel.push(obj);
                }
            })();
            totalW=totalW;
            ele=$('<ul class="ui-cel ui-inner-tree" style="width:' + totalW+unit + '" id="'+id+'"></ul>');
            //修改子树各个列长度
            (function(){
                width=initW*100/totalW;
                var obj,w
                for(var i=0;i<tableCel.length;i++){
                    obj=tableCel[i];
                    w=obj.width.replace(reg,"");
                    w=w*100/totalW;
                    obj.width=w+unit;
                }
            })();
            //构造子树
            var that=this;
            setTimeout(function(){
                that.createChildTree(id,width+unit,param,tableCel);
            },0);
            return ele;
        },
        createChildTree(id,width,param,tableCel){
            var type=param.type,
                url=param.url,
                ajaxData=param.ajaxData,
                zNodes=param.zNodes||[];
              
            new TreeTable({
                id:id,
                autoUpdate:true,
                titleWidth:width,
                zNodes:zNodes,

                checkWidth:0,
                tableCel:tableCel,
            });
        },
        //构造操作类型单元格
        creatOperateCelOfTree:function(celObj, treeNode){
            var type=celObj.type,//列类型
                name = celObj.name,//列名
                text=celObj.text,//列头显示文字
                width = celObj.width||"100px",//列宽度
                blankText=celObj.blankText,//没有数据时，内容显示空白数据
                param=celObj.param||{};//根据不同的列类型type会有不同的参数
             //读取接口数据
            var nodeVal = treeNode[name];
            var that=this;
            var list=param.list||[];
            var ele=$('<div class="ui-operate" style="width:'+width+'"></div>');
            var name,text,click,operateEle;
            for(var i=0;i<list.length;i++){
                name=list[i].name;
                text=list[i].text;
                click=list[i].click;
                operateEle=$('<a href="javascript:void(0)" name="'+name+'">'+text+'</a>');
                if(typeof click==="function"){
                    (function(click){
                        operateEle.bind("click",function(e){
                            setTimeout(function(){//设置一定的延迟，使得添加的事件在树节点选中之后再执行该事件
                                click.call(that,e);
                            },0);
                        })
                    })(click);
                    
                }
                ele.append(operateEle);
            }
            return ele;
        },

        destroy: function() {
            $.fn.zTree.destroy(this.id);
        },
        //更新树
        update: function() {
        	var that=this;
            if(that.url){//有url则异步获取数据
                that.destroy();
                that.getAjaxData(function(zNodes){
                    that.createTree(zNodes);
                });
            }else{//没有url，取静态zNodes参数
                that.createTree(that.zNodes||[]);
            }
        },
        afterUpdate:function(){},
        getCheckRow: function() {
        	var treeId=this.id;
        	var treeObj = $.fn.zTree.getZTreeObj(treeId);
			var nodes = treeObj.getSelectedNodes()||[];
			return nodes;
        },
        expandAll: function() {
        	var treeId=this.id;
        	var treeObj = $.fn.zTree.getZTreeObj(treeId);
			treeObj.expandAll(true);
        },
        foldAll: function() {
        	var treeId=this.id;
        	var treeObj = $.fn.zTree.getZTreeObj(treeId);
			treeObj.expandAll(false);
        }
    };
    return TreeTable;
});