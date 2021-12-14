sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/table/SelectionMode',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    Fragment,
    Filter,
    FilterOperator,
    SelectionMode,
    AppUtils,
    ComboEntry,
    ODataReadError,
    ServiceNames
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.mvc.controller.nightduty.CurrentListDialogHandler', {
      constructor: function (oController, sSelectionMode) {
        this.oCurrentListDialog = null;
        this.sCurrentListTableId = 'currentListTable';
        this.YYYYMM = oController.getSessionProperty('DTFMTYYYYMM');

        const oTodayMoment = moment().hours(9);
        this.sThisMonth = oTodayMoment.format(this.YYYYMM);

        const oModel = new JSONModel({
          dialog: {
            busy: true,
            isActiveApproval: false,
            yearMonth: this.sThisMonth,
            selectedDutyGroup: 'ALL',
            dutyGroups: new ComboEntry({
              aEntries: [
                { code: 'A', text: 'A' },
                { code: 'B', text: 'B' },
              ],
            }),
            currentList: null,
            currentListRowCount: 1,
            currentListMode: sSelectionMode,
            selectedData: [],
          },
        });

        this.oController = oController;
        this.oDialogModel = oModel;
      },

      async openDialog() {
        if (!this.oCurrentListDialog) {
          this.oCurrentListDialog = await Fragment.load({
            name: 'sap.ui.yesco.mvc.view.nightduty.fragment.CurrentListDialog',
            controller: this,
          });

          this.oController.getView().addDependent(this.oCurrentListDialog);
          this.oCurrentListDialog
            .setModel(this.oDialogModel)
            .bindElement('/dialog')
            .attachBeforeOpen(() => {
              this.initCurrentListSearchConditions();
              this.onPressCurrentListSearch();
            })
            .attachAfterClose(() => {
              this.clearDialog();
            });
        }

        this.oCurrentListDialog.open();
      },

      /**
       *
       */
      onPressDialogClose() {
        this.oCurrentListDialog.close();
      },

      /**
       *
       */
      initCurrentListSearchConditions() {
        this.oDialogModel.setProperty('/dialog/yearMonth', this.sThisMonth);
        this.oDialogModel.setProperty('/dialog/selectedDutyGroup', 'ALL');
      },

      /**
       * 나의 당직근무 - 당직근무현황 조회 아이콘 press event handler
       */
      async onPressCurrentListSearch() {
        try {
          this.oDialogModel.setProperty('/dialog/busy', true);

          const aCurrentListTableData = await this.readCurrentListTableData();

          this.setCurrentListTableData(aCurrentListTableData);
        } catch (oError) {
          AppUtils.debug('Controller > Nightduty Summary > Dialog > onPressCurrentListSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.oDialogModel.setProperty('/dialog/busy', false);
        }
      },

      async readCurrentListTableData() {
        return new Promise((resolve, reject) => {
          const sPernr = this.oController.getAppointeeProperty('Pernr');
          const sYearMonth = this.oDialogModel.getProperty('/dialog/yearMonth').replace(/\D/g, '');
          const aFilters = [
            new Filter('Pernr', FilterOperator.EQ, sPernr), //
            new Filter('Begmm', FilterOperator.EQ, sYearMonth),
            new Filter('Endmm', FilterOperator.EQ, sYearMonth),
          ];

          const sSelectedDutyGroup = this.oDialogModel.getProperty('/dialog/selectedDutyGroup').replace(/ALL/g, '');
          if (sSelectedDutyGroup) {
            aFilters.push(new Filter('Ocshf', FilterOperator.EQ, sSelectedDutyGroup));
          }

          const sUrl = '/OnCallListSet';
          this.oController.getModel(ServiceNames.WORKTIME).read(sUrl, {
            filters: aFilters,
            success: (mData) => {
              AppUtils.debug(`${sUrl} success.`, mData);

              resolve(mData.results);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      setCurrentListTableData(aCurrentListData = []) {
        this.oDialogModel.setProperty('/dialog/currentList', aCurrentListData);
        this.oDialogModel.setProperty('/dialog/currentListRowCount', aCurrentListData.length || 1);
      },

      onChangeRowSelection() {},

      clearDialog() {
        this.oDialogModel.setProperty('/dialog/currentList', []);
      },
    });
  }
);
