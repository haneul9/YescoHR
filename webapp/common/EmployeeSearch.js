sap.ui.define([
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
], function(
	Fragment
) {
	"use strict";

	return {

       /*
        *  선택버튼
        */
        onSelectClick() {

        },

       /*
        *  닫기버튼
        */
       onCloseClick(oEvent) {
        oEvent.getSource().getParent().close();
       },

       /*
        *  사원검색 Dialog호출
        */
       onSearchDialog() {
           const oView = this.getView();

        if (!this.dSearchDialog) {
            this.dSearchDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.fragment.EmployeeSearch',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          this.dSearchDialog.then(function (oDialog) {
            oDialog.open();
          });
       },

       /*
        *  조직검색 Dialog호출
        */
       onGroupDetail() {
           const oView = this.getView();

        if (!this.dGroupDialog) {
            this.dGroupDialog = Fragment.load({
              id: `${oView.getId()}GroupDetail`,
              name: 'sap.ui.yesco.fragment.GroupDetail',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          this.dGroupDialog.then(function (oDialog) {
            oDialog.open();
          });
       },
	};
});