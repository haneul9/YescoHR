sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    JSONModel,
    Fragment,
    MessageBox,
    AppUtils,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.common.GroupDialogHandler', {
      oController: null,
      oGroupDialog: null,
      oTable: null,
      fCallback: null,

      constructor: function (oController, fCallback) {
        this.oController = oController;
        this.fCallback = fCallback;
      },

      async openDialog() {
        if (!this.oGroupDialog) {
          this.oGroupDialog = await Fragment.load({
            name: 'sap.ui.yesco.fragment.OrganizationDialog',
            controller: this,
          });

          this.oGroupDialog
            .setModel(new JSONModel(this.getInitData()))
            .attachBeforeOpen(() => {
              this.oTable = this.oGroupDialog.getContent()[1].getItems()[0];
              this.readDialogData();
            })
            .attachAfterClose(() => {
              this.oTable.clearSelection();
              this.oGroupDialog.getModel().setData(this.getInitData());
            });
        }

        this.oController.getView().addDependent(this.oGroupDialog);
        this.oGroupDialog.open();
      },

      getInitData() {
        return {
          busy: true,
          Datum: moment().toDate(),
          Stext: '',
          orglist: [],
          rowcount: 1,
        };
      },

      async readDialogData() {
        const oDialogModel = this.oGroupDialog.getModel();

        try {
          const oDialogData = oDialogModel.getData();
          const aOrgList = await Client.getEntitySet(this.oController.getModel(ServiceNames.COMMON), 'OrgList', {
            Datum: oDialogData.Datum,
            Stype: '1',
            Stext: oDialogData.Stext || _.noop(),
          });

          _.chain(oDialogData)
            .set('orglist', aOrgList ?? [])
            .set('rowcount', Math.min(5, aOrgList.length || 1))
            .commit();
        } catch (oError) {
          AppUtils.debug('Controller > GroupDialogHandler > readDialogData Error', oError);

          AppUtils.handleError(oError);
        }

        oDialogModel.setProperty('/busy', false);
      },

      onPressSelectOrg() {
        const aOrgList = this.oGroupDialog.getModel().getProperty('/orglist');
        const aSelectedIndices = this.oTable.getSelectedIndices();

        if (_.isEmpty(aSelectedIndices)) {
          MessageBox.alert(this.oController.getBundleText('MSG_00054')); // 부서를 선택하세요.
          return;
        }

        this.fCallback(_.map(aSelectedIndices, (v) => _.get(aOrgList, v)));
        this.oGroupDialog.close();
      },

      onPressCloseOrg() {
        this.oGroupDialog.close();
      },

      onPressSearchOrg() {
        this.readDialogData();
      },
    });
  }
);
