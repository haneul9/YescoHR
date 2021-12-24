sap.ui.define(['sap/ui/yesco/mvc/controller/BaseController', 'sap/m/Button', 'sap/m/Dialog', 'sap/m/List', 'sap/m/StandardListItem', 'sap/ui/core/mvc/Controller', 'sap/ui/model/json/JSONModel', 'sap/m/ButtonType', 'sap/m/MessageToast'], function (BaseController, Button, Dialog, List, StandardListItem, Controller, JSONModel, ButtonType, MessageToast) {
  'use strict';

  return BaseController.extend('sap.ui.yesco.mvc.controller.talent.Talent', {
    pressDialog: null,
    fixedSizeDialog: null,
    resizableDialog: null,
    draggableDialog: null,
    escapePreventDialog: null,
    confirmEscapePreventDialog: null,
    onDialogPress: function () {
      if (!this.pressDialog) {
        this.pressDialog = new Dialog({
          title: '인재검색',
          content: new List({
            items: {
              path: '/ProductCollection',
              template: new StandardListItem({
                title: '{Name}',
                counter: '{Quantity}',
              }),
            },
          }),
          beginButton: new Button({
            type: ButtonType.Emphasized,
            text: '확인',
            press: function () {
              this.pressDialog.close();
            }.bind(this),
          }),
        });

        //to get access to the global model
        this.getView().addDependent(this.pressDialog);
      }

      this.pressDialog.open();
    },

    /**
     * @override
     */
    onBeforeShow() {
      var oModel = new JSONModel(sap.ui.require.toUrl('sap/ui/yesco/localService/mockdata/talent.json'));
      this.getView().setModel(oModel);
    },

    onModeChange: function (oEvent) {
      var sMode = oEvent.getParameter('item').getKey();

      this.byId('talentList').setMode(sMode);
      this.byId('talentList').setHeaderText('GridList with mode ' + sMode);
    },

    onSelectionChange: function (oEvent) {
      var oGridListItem = oEvent.getParameter('listItem'),
        bSelected = oEvent.getParameter('selected');

      MessageToast.show((bSelected ? 'Selected' : 'Unselected') + ' item with Id ' + oGridListItem.getId());
    },

    onDelete: function (oEvent) {
      var oGridListItem = oEvent.getParameter('listItem');

      MessageToast.show('Delete item with Id ' + oGridListItem.getId());
    },

    onDetailPress: function (oEvent) {
      var oGridListItem = oEvent.getSource();

      MessageToast.show('Request details for item with Id ' + oGridListItem.getId());
    },

    onPress: function (oEvent) {
      var oGridListItem = oEvent.getSource();

      MessageToast.show('Pressed item with Id ' + oGridListItem.getId());
    },
  });
});
