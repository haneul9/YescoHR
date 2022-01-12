sap.ui.define(
  [
    //
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/m/MessageToast',
  ],
  (
    //
    BaseController,
    JSONModel,
    Fragment,
    MessageToast
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.talent.Talent', {
      onDialog() {
        if (!this.byId('talentCompareDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.talent.fregment.CompareDialog',
            controller: this,
          }).then((oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
            oDialog.open();
          });
        } else {
          this.byId('talentCompareDialog').open();
        }
      },

      onClick() {
        this.byId('talentCompareDialog').close();
      },

      /**
       * @override
       */
      onBeforeShow() {
        var oModel = new JSONModel(sap.ui.require.toUrl('sap/ui/yesco/localService/mockdata/talent.json'));
        this.getView().setModel(oModel);
      },

      onModeChange(oEvent) {
        var sMode = oEvent.getParameter('item').getKey();

        this.byId('talentList').setMode(sMode);
        this.byId('talentList').setHeaderText('GridList with mode ' + sMode);
      },

      onSelectionChange(oEvent) {
        var oGridListItem = oEvent.getParameter('listItem'),
          bSelected = oEvent.getParameter('selected');

        MessageToast.show((bSelected ? 'Selected' : 'Unselected') + ' item with Id ' + oGridListItem.getId());
      },

      onDelete(oEvent) {
        var oGridListItem = oEvent.getParameter('listItem');

        MessageToast.show('Delete item with Id ' + oGridListItem.getId());
      },

      onDetailPress(oEvent) {
        var oGridListItem = oEvent.getSource();

        MessageToast.show('Request details for item with Id ' + oGridListItem.getId());
      },

      onPress(oEvent) {
        var oGridListItem = oEvent.getSource();

        MessageToast.show('Pressed item with Id ' + oGridListItem.getId());
      },

      onToggleExpand() {
        const osearchFilterBody = this.byId('searchFilterBody');
        osearchFilterBody.toggleStyleClass('expanded');
      },
    });
  }
);
