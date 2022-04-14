sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    Fragment,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.common.EmployeeSearchDialogHandler', {
      oController: null,
      oCommonEmployeeSearchDialog: null,
      fCallback: null,

      sEmployeeTableId: 'empTable',

      constructor: function (oController, fCallback) {
        this.oController = oController;
        this.fCallback = fCallback;
      },

      getInitData() {
        return {
          busy: false,
          settings: {
            initialLoaded: false,
            searchConditions: { Accty: null, Persa: null, Ename: null, Orgeh: null, Orgtx: null, Stat2: null, Persg: null, Persk: null },
            fieldEnabled: { Persa: true, Ename: true, Orgeh: true, Stat2: true, Persg: true, Persk: true },
            fieldVisible: { Pernr: true, Ename: true, Fulln: true, Zzjikgbt: true, Zzjikcht: true, Stat2tx: true, Entda: true, Retdt: true },
          },
          entry: {
            persArea: [],
            workType: [],
            empGroup: [],
            subEmpGroup: [],
          },
          results: {
            rowCount: 0,
            list: [],
          },
          selectedEmployees: [],
        };
      },

      async openDialog() {
        if (!this.oCommonEmployeeSearchDialog) {
          this.oCommonEmployeeSearchDialog = await Fragment.load({
            name: 'sap.ui.yesco.fragment.EmployeeSearch',
            controller: this,
          });

          this.oCommonEmployeeSearchDialog
            .setModel(new JSONModel(this.getInitData()))
            .attachBeforeOpen(() => {
              this.assignSettings();
              this.readEntryData();
            })
            .attachAfterOpen(() => {
              this.initialLoaded();
            })
            .attachAfterClose(() => {
              this.oCommonEmployeeSearchDialog.getModel().setData(this.getInitData());
            });

          this.oController.getView().addDependent(this.oCommonEmployeeSearchDialog);
        }

        this.oCommonEmployeeSearchDialog.open();
      },

      assignSettings() {
        const mEmployeeModelSettings = this.oCommonEmployeeSearchDialog.getModel().getProperty('/settings');
        const mEmployeeSettings = this.oController.getViewModel().getProperty('/employeeDialogSettings') ?? {};

        _.forEach(mEmployeeSettings, (v, p) => _.set(mEmployeeModelSettings, p, _.assignIn(mEmployeeModelSettings[p], v)));
      },

      initialLoaded() {
        try {
          const bInitialSearch = this.oCommonEmployeeSearchDialog.getModel().getProperty('/settings/initialLoaded');

          if (bInitialSearch) this.readData();
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      async readEntryData() {
        const oEmployeeDialogModel = this.oCommonEmployeeSearchDialog.getModel();

        try {
          const fCurriedCommonGetEntitySet = Client.getEntitySet(this.oController.getModel(ServiceNames.COMMON));
          const sAccty = oEmployeeDialogModel.getProperty('/settings/searchConditions/Accty');

          const [aAreaList, aWorkList, aEmpList] = await Promise.all([
            fCurriedCommonGetEntitySet('PersAreaList', { Zall: sAccty === 'Z' ? 'X' : null }), //
            fCurriedCommonGetEntitySet('EmpCodeList', { Field: 'STAT2' }),
            fCurriedCommonGetEntitySet('EmpCodeList', { Field: 'PERSG' }),
          ]);

          oEmployeeDialogModel.setProperty('/entry', {
            persArea: new ComboEntry({ codeKey: 'Werks', valueKey: 'Pbtxt', aEntries: aAreaList }),
            workType: new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aWorkList }),
            empGroup: new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aEmpList }),
            subEmpGroup: new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }),
          });
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      async readData() {
        const oEmployeeDialogModel = this.oCommonEmployeeSearchDialog.getModel();

        oEmployeeDialogModel.setProperty('/busy', true);

        try {
          this.oController.byId(this.sEmployeeTableId).clearSelection();

          const mSearchConditions = oEmpModel.getProperty('/settings/searchConditions');
          const aResults = await Client.getEntitySet(this.oController.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
            Menid: this.oController.getCurrentMenuId(),
            ..._.pick(mSearchConditions, ['Ename', 'Orgeh', 'Accty', 'Persa', 'Stat2', 'Persg', 'Persk']),
          });

          oEmployeeDialogModel.setProperty('/results/list', aResults);
          oEmployeeDialogModel.setProperty('/results/rowCount', Math.min(aResults.length, 15));
        } catch (oError) {
          throw oError;
        } finally {
          oEmployeeDialogModel.setProperty('/busy', false);
        }
      },

      onClose() {
        this.oCommonEmployeeSearchDialog.close();
      },
    });
  }
);
