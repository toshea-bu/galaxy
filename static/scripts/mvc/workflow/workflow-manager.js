"use strict";define(["mvc/workflow/workflow-connector","libs/toastr"],function(t,n){function e(t,n){this.app=t,this.canvas_container=n,this.id_counter=0,this.nodes={},this.name=null,this.has_changes=!1,this.active_form_has_changes=!1,this.workflowOutputLabels={}}return $.extend(e.prototype,{canLabelOutputWith:function(t){return!t||!(t in this.workflowOutputLabels)},registerOutputLabel:function(t){t&&(this.workflowOutputLabels[t]=!0)},unregisterOutputLabel:function(t){t&&delete this.workflowOutputLabels[t]},updateOutputLabel:function(t,e){t&&this.unregisterOutputLabel(t),this.canLabelOutputWith(e)||n.warning("Workflow contains duplicate workflow output labels "+e+". This must be fixed before it can be saved."),e&&this.registerOutputLabel(e)},attemptUpdateOutputLabel:function(t,n,e){return!!this.canLabelOutputWith(e)&&(t.labelWorkflowOutput(n,e),t.nodeView.redrawWorkflowOutputs(),!0)},create_node:function(t,n,e){var o=this.app.prebuildNode(t,n,e);return this.add_node(o),this.fit_canvas_to_nodes(),this.app.canvas_manager.draw_overview(),this.activate_node(o),o},add_node:function(t){t.id=this.id_counter,t.element.attr("id","wf-node-step-"+t.id),this.id_counter++,this.nodes[t.id]=t,this.has_changes=!0,t.workflow=this},remove_node:function(t){this.active_node==t&&this.clear_active_node(),delete this.nodes[t.id],this.has_changes=!0},remove_all:function(){wf=this,$.each(this.nodes,function(t,n){n.destroy(),wf.remove_node(n)})},rectify_workflow_outputs:function(){var t=!1,n=!1;if($.each(this.nodes,function(e,o){o.workflow_outputs&&o.workflow_outputs.length>0&&(t=!0),$.each(o.post_job_actions,function(t,e){"HideDatasetAction"===e.action_type&&(n=!0)})}),!1!==t||!1!==n){var e=this;$.each(this.nodes,function(n,o){if("tool"===o.type){var i=!1;null==o.post_job_actions&&(o.post_job_actions={},i=!0);var a=[];$.each(o.post_job_actions,function(t,n){"HideDatasetAction"==n.action_type&&a.push(t)}),a.length>0&&$.each(a,function(t,n){i=!0,delete o.post_job_actions[n]}),t&&$.each(o.output_terminals,function(t,n){if(!0===!o.isWorkflowOutput(n.name)){i=!0;var e={action_type:"HideDatasetAction",output_name:n.name,action_arguments:{}};o.post_job_actions["HideDatasetAction"+n.name]=null,o.post_job_actions["HideDatasetAction"+n.name]=e}}),e.active_node==o&&!0===i&&e.reload_active_node()}})}},to_simple:function(){var t={};return $.each(this.nodes,function(n,e){var o={};$.each(e.input_terminals,function(t,n){o[n.name]=null;var e=[];$.each(n.connectors,function(t,i){if(i.handle1){var a={id:i.handle1.node.id,output_name:i.handle1.name},s=n.attributes.input.input_subworkflow_step_id;void 0!==s&&(a.input_subworkflow_step_id=s),e[t]=a,o[n.name]=e}})});var i={};e.post_job_actions&&$.each(e.post_job_actions,function(t,n){var e={action_type:n.action_type,output_name:n.output_name,action_arguments:n.action_arguments};i[n.action_type+n.output_name]=null,i[n.action_type+n.output_name]=e}),e.workflow_outputs||(e.workflow_outputs=[]);var a={id:e.id,type:e.type,content_id:e.content_id,tool_version:e.config_form.version,tool_state:e.tool_state,errors:e.errors,input_connections:o,position:$(e.element).position(),annotation:e.annotation,post_job_actions:e.post_job_actions,uuid:e.uuid,label:e.label,workflow_outputs:e.workflow_outputs};t[e.id]=a}),{steps:t}},from_simple:function(n,e){var o=void 0===e||e,i=this,a=0;o?i.name=n.name:a=Object.keys(i.nodes).length;var s=a,c=!1;$.each(n.steps,function(t,n){var e=i.app.prebuildNode(n.type,n.name,n.content_id);o||(n.uuid=null,$.each(n.workflow_outputs,function(t,n){n.uuid=null})),e.init_field_data(n),n.position&&e.element.css({top:n.position.top,left:n.position.left}),e.id=parseInt(n.id)+a,i.nodes[e.id]=e,s=Math.max(s,parseInt(t)+a),c||(e.workflow_outputs.length>0?c=!0:$.each(e.post_job_actions||[],function(t,n){"HideDatasetAction"===n.action_type&&(c=!0)}))}),i.id_counter=s+1,$.each(n.steps,function(n,e){var o=i.nodes[parseInt(n)+a];$.each(e.input_connections,function(n,e){e&&($.isArray(e)||(e=[e]),$.each(e,function(e,s){var c=i.nodes[parseInt(s.id)+a],u=new t;u.connect(c.output_terminals[s.output_name],o.input_terminals[n]),u.redraw()}))}),c&&$.each(o.output_terminals,function(t,n){void 0===o.post_job_actions["HideDatasetAction"+n.name]&&(o.addWorkflowOutput(n.name),$(o.element).find(".callout."+n.name).find("img").attr("src",Galaxy.root+"static/images/fugue/asterisk-small.png"),i.has_changes=!0)})})},check_changes_in_active_form:function(){this.active_form_has_changes&&(this.has_changes=!0,$("#right-content").find("form").submit(),this.active_form_has_changes=!1)},reload_active_node:function(){if(this.active_node){var t=this.active_node;this.clear_active_node(),this.activate_node(t)}},clear_active_node:function(){this.active_node&&(this.active_node.make_inactive(),this.active_node=null),this.app.showAttributes()},activate_node:function(t){this.active_node!=t&&(this.check_changes_in_active_form(),this.clear_active_node(),this.app.showForm(t.config_form,t),t.make_active(),this.active_node=t)},node_changed:function(t,n){this.has_changes=!0,this.active_node==t&&n&&(this.check_changes_in_active_form(),this.app.showForm(t.config_form,t)),this.app.showWorkflowParameters()},layout:function(){this.check_changes_in_active_form(),this.has_changes=!0;var t={},n={};$.each(this.nodes,function(e,o){void 0===t[e]&&(t[e]=0),void 0===n[e]&&(n[e]=[])}),$.each(this.nodes,function(e,o){$.each(o.input_terminals,function(e,i){$.each(i.connectors,function(e,i){var a=i.handle1.node;t[o.id]+=1,n[a.id].push(o.id)})})});for(var e=[];;){var o=[];for(var i in t)0==t[i]&&o.push(i);if(0==o.length)break;e.push(o);for(var a in o){var s=o[a];delete t[s];for(var c in n[s])t[n[s][c]]-=1}}if(!t.length){var u=this.nodes;v_pad=30;var r=80;$.each(e,function(t,n){n.sort(function(t,n){return $(u[t].element).position().top-$(u[n].element).position().top});var e=0,o=v_pad;$.each(n,function(t,n){var i=u[n],a=$(i.element);$(a).css({top:o,left:r}),e=Math.max(e,$(a).width()),o+=$(a).height()+v_pad}),r+=e+80}),$.each(u,function(t,n){n.redraw()})}},bounds_for_all_nodes:function(){var t,n=1/0,e=-1/0,o=1/0,i=-1/0;return $.each(this.nodes,function(a,s){var c=$(s.element);t=c.position(),n=Math.min(n,t.left),e=Math.max(e,t.left+c.width()),o=Math.min(o,t.top),i=Math.max(i,t.top+c.width())}),{xmin:n,xmax:e,ymin:o,ymax:i}},fit_canvas_to_nodes:function(){function t(t,n){return Math.ceil(t/n)*n}function n(t,n){return t<n||t>3*n?-(t-(Math.ceil(t%n/n)+1)*n):0}var e=this.bounds_for_all_nodes(),o=this.canvas_container.position(),i=this.canvas_container.parent(),a=n(e.xmin,100),s=n(e.ymin,100);a=Math.max(a,o.left),s=Math.max(s,o.top);var c=o.left-a,u=o.top-s,r=t(e.xmax+100,100)+a,h=t(e.ymax+100,100)+s;r=Math.max(r,-c+i.width()),h=Math.max(h,-u+i.height()),this.canvas_container.css({left:c,top:u,width:r,height:h}),this.canvas_container.children().each(function(){var t=$(this).position();$(this).css("left",t.left+a),$(this).css("top",t.top+s)})}}),e});
//# sourceMappingURL=../../../maps/mvc/workflow/workflow-manager.js.map
