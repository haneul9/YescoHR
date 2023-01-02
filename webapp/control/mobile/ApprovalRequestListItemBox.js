sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/m/FlexItemData',
    'sap/m/HBox',
    'sap/m/Text',
    'sap/ui/core/CustomData',
    'sap/ui/yesco/common/TableUtils',
  ],
  (
    // prettier 방지용 주석
    FlexItemData,
    HBox,
    Text,
    CustomData,
    TableUtils
  ) => {
    'use strict';

    return HBox.extend('sap.ui.yesco.control.mobile.ApprovalRequestListItemBox', {
      metadata: {
        properties: {
          statusFieldName: { type: 'string', group: 'Misc', defaultValue: 'ZappStatAl' },
        },
      },

      renderer: {},

      /**
       * @override
       */
      constructor: function (...aArgs) {
        HBox.apply(this, aArgs);

        const sStatusFieldName = this.getStatusFieldName();

        this.addStyleClass('approval-request-list-item-box') // prettier 방지용 주석
          .addCustomData(
            new CustomData({
              key: 'status',
              value: `Z{${sStatusFieldName}}`,
              writeToDom: true,
            })
          );

        if (this.getItems().length < 2) {
          this.addItem(
            new Text({
              text: {
                path: this.getStatusFieldName(),
                formatter: TableUtils.StatusTxt,
              },
              layoutData: new FlexItemData({
                styleClass: 'approval-request-status',
              }),
            })
          );
        }
      },
    });
  }
);
