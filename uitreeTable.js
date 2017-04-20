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
            addDiyDom: addDiyDom,
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
            	name:"name",//一般需要具体设置
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
            }
        }
    };

    //构造列
    function createTreeCel(celObj, treeNode) {
        var name = celObj.name;
        var text=celObj.text;
        var width = celObj.width||"100px";
        var val=celObj.value;
        var text = treeNode[name];
        if (text === undefined) {
        	if(val){
        		val='<div class="ui-operate" style="width:'+width+'">'+val+'</div>'
        		return val;
        	}
            text = name;
        }
        var str = '<span class="ui-cel" style="width:' + width + '" title="'+text+'">' + text + '</span>';
        return str;
    }
    function attachDiyDomEvent(aEle,treeId, treeNode){
    	var that=this;
    	for(var j=0,el,et,ev;j<that.events.length;j++){//表格中，操作行内的事件绑定
	        el=aEle.find(that.events[j][1]);
        	et=that.events[j][0];
        	ev=that.events[j][2]
        	if(typeof ev==="string"&&typeof that[ev]==="function"){
        		ev=that[ev];
        	}
        	(function(ev){
	        	var evtObj={};
	    		evtObj[et]=$.proxy(function(e){
	        		var that=this;
	    			setTimeout(function(){//设置一定的延迟，使得添加的事件在树节点选中之后再执行该事件
	        			ev.call(that,e);
	        		},0);
	        	},that);
	        	if(el.length){
	        		el.bind(evtObj);
	        	}
        	})(ev);
        }
    }
    function addDiyDom(treeId, treeNode) {
        var treeEle = $("#" + treeId);
        var switchEle = $("#" + treeNode.tId + IDMark_Switch);
        var aEle = $("#" + treeNode.tId + IDMark_A);
        var iconEle = $("#" + treeNode.tId + IDMark_Icon);

        var reg = /.*level(\d+).*/g;
        var level = Number(aEle.attr("class").replace(reg, "$1"));
        var indentStr = '<span class="ui-indent"></span>';
        var indentStrs = '';
        var that=treeEle.data();
        var checkWidth=that.checkWidth||"50px";
        var titleWidth=that.titleWidth||"200px";
        for (var i = 0; i < level; i++) {
            indentStrs += indentStr;
        }

        if (treeNode.id === "title") { //相当于表格的表头
            iconEle.remove();
            aEle.addClass("ui-title");
        }

        //修改展开按钮结构位置
        aEle.prepend(switchEle);
        //修改原来的树控件结构
        aEle.append($('<div class="ui-name" style="width:'+titleWidth+'">' + indentStrs + '</div>').append(aEle.children()));
        //向树控件添加checkbox
        aEle.prepend('<span class="ui-cel ui-check" style="width:'+checkWidth+'" title="单击时同时按下 Ctrl 键可以选中多个节点"></span>');
        
        //向树控件添加其他列
        var tableCel = that.tableCel||[];
        for (var i = 0; i < tableCel.length; i++) {
            var node = createTreeCel(tableCel[i], treeNode);
            aEle.append(node);
        }

        attachDiyDomEvent.call(that,aEle,treeId, treeNode);
    }

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
        				id:"title",
        				name:options.titleText,
                        width:options.titleWidth
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
            this.setting = setting;
        },
        getAjaxData: function() {
            var that = this;
            $.ajax({
                type: that.type||"get",
                url: that.url,
                success: function(zNodes) {
                    zNodes = zNodes ? zNodes : [];
                    if(!$.isArray(zNodes)){
                    	zNodes=$.parseJSON(zNodes);
                    }
                    
                    if(that.titleObj){
                    	zNodes.unshift(that.titleObj);
                    }
                    if(that.formatzNodes&&typeof that.formatzNodes==="function"){
                    	zNodes=that.formatzNodes(zNodes);
                    }
                    $.fn.zTree.init($("#" + that.id), that.setting,zNodes );
                	that._attachEvents();

                	if(typeof that.afterUpdate==="function"){
                		that.afterUpdate();
                	}
                },
                error: function(e) {
                    alert(String(e));
                }
            });
        },
        destroy: function() {
            $.fn.zTree.destroy(this.id);
        },
        update: function() {
        	var that=this;
            that.destroy();
            that.getAjaxData();
        },
        afterUpdate:function(){

        },
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