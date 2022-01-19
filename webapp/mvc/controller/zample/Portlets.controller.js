sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/f/dnd/GridDropInfo',
    'sap/ui/core/Fragment',
    'sap/ui/core/dnd/DragInfo',
    'sap/ui/core/dnd/DropLayout',
    'sap/ui/core/dnd/DropPosition',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    GridDropInfo,
    Fragment,
    DragInfo,
    DropLayout,
    DropPosition,
    JSONModel,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.zample.Portlets', {
      onBeforeShow() {
        const portletsModel = new JSONModel();
        portletsModel.loadData('localService/p13nGridData.json');
        this.setViewModel(portletsModel, 'portletsModel');

        const oGrid = this.byId('portlets-grid');

        oGrid.addDragDropConfig(
          new DragInfo({
            sourceAggregation: 'items',
          })
        );

        oGrid.addDragDropConfig(
          new GridDropInfo({
            targetAggregation: 'items',
            dropPosition: DropPosition.Between,
            dropLayout: DropLayout.Horizontal,
            drop: this.onDrop,
          })
        );

        // Use smaller margin around grid when on smaller screens
        oGrid.attachLayoutChange((oEvent) => {
          const sLayout = oEvent.getParameter('layout');

          if (sLayout === 'layoutXS' || sLayout === 'layoutS') {
            oGrid.removeStyleClass('sapUiSmallMargin');
            oGrid.addStyleClass('sapUiTinyMargin');
          } else {
            oGrid.removeStyleClass('sapUiTinyMargin');
            oGrid.addStyleClass('sapUiSmallMargin');
          }
        });
      },

      onDrop(oEvent) {
        const oGrid = oEvent.getSource().getParent();
        const oDragged = oEvent.getParameter('draggedControl');
        const oDropped = oEvent.getParameter('droppedControl');
        const sInsertPosition = oEvent.getParameter('dropPosition');
        const iDragPosition = oGrid.indexOfItem(oDragged);
        let iDropPosition = oGrid.indexOfItem(oDropped);

        oGrid.removeItem(oDragged);

        if (iDragPosition < iDropPosition) {
          iDropPosition--;
        }

        if (sInsertPosition === 'After') {
          iDropPosition++;
        }

        oGrid.insertItem(oDragged, iDropPosition);
      },

      async onObjectMatched() {
        this.oSettingDialog = await Fragment.load({
          name: 'sap.ui.yesco.mvc.view.app.fragment.SettingDialog',
          controller: this,
        });

        this.getView().addDependent(this.oSettingDialog);
      },

      onPressSettingDialogOpen() {
        this.oSettingDialog.open();
      },

      onPressSettingDialogClose() {
        this.oSettingDialog.close();
      },

      reduceViewResource() {
        this.byId('portlets-grid').destroyItems();
        this.getView().removeDependent(this.oSettingDialog);
        this.oSettingDialog.destroy();
        return this;
      },
    });
  }
);
