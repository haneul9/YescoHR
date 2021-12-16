sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
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
    JSONModel,
    SelectionMode,
    AppUtils,
    ComboEntry,
    ODataReadError,
    ServiceNames
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.mvc.controller.nightduty.CurrentListDialogHandler', {
      constructor: function ({ oController, sMode = 'R', fnCallback = () => {} }) {
        this.oController = oController;
        this.sMode = sMode;
        this.fnCallback = fnCallback;
        this.oCurrentListDialog = null;
        this.sCurrentListTableId = 'currentListTable';
        this.sThisMonth = moment().hours(9).format(oController.getSessionProperty('DTFMTYYYYMM'));
        this.oDialogModel = new JSONModel(this.getInitialData(sMode));
      },

      getInitialData() {
        return {
          dialog: {
            busy: true,
            enabled: false,
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
            currentListMode: this.sMode === 'S' ? SelectionMode.MultiToggle : SelectionMode.None,
            selectedList: [],
          },
        };
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
              this.initDialogData();
              this.onPressCurrentListSearch();
            })
            .attachAfterClose(() => {
              this.initDialogData();
            });
        }

        this.oCurrentListDialog.open();
      },

      /**
       *
       */
      initDialogData() {
        sap.ui.getCore().byId(this.sCurrentListTableId).clearSelection();
        this.oDialogModel.setData(this.getInitialData());
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

      setCurrentListTableData(aCurrentListData) {
        this.oDialogModel.setProperty('/dialog/currentList', aCurrentListData);
        this.oDialogModel.setProperty('/dialog/currentListRowCount', (aCurrentListData || []).length || 1);
        if (this.sMode === 'S') {
          this.oDialogModel.setProperty('/dialog/selectedList', []);
          this.oDialogModel.setProperty('/dialog/enabled', false);
        }
      },

      onChangeRowSelection(oEvent) {
        if (this.sMode !== 'S') {
          return;
        }

        const oTable = oEvent.getSource();
        const aSelectedIndices = oTable.getSelectedIndices();

        this.oDialogModel.setProperty('/dialog/enabled', aSelectedIndices.length > 0);
        this.oDialogModel.setProperty(
          '/dialog/selectedList',
          aSelectedIndices.map((i) => this.oDialogModel.getProperty(`/dialog/list/${i}`))
        );
      },

      onPressSelectionDone() {
        const aSelectedListData = this.oDialogModel.getProperty('/dialog/selectedList');

        this.fnCallback(aSelectedListData);

        this.onPressDialogClose();
      },

      onPressDialogClose() {
        this.oCurrentListDialog.close();
      },
    });
  }
);
