sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/base/Object',
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/table/SelectionMode',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    BaseObject,
    Fragment,
    JSONModel,
    SelectionMode,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.mvc.controller.nightduty.CurrentListDialogHandler', {
      constructor: function ({ oController, sSelectionMode = SelectionMode.None, fnCallback = () => {} }) {
        this.oController = oController;
        this.sSelectionMode = sSelectionMode;
        this.fnCallback = fnCallback;
        this.oCurrentListDialog = null;
        this.sCurrentListTableId = 'currentListTable';
        this.sThisMonth = moment().hours(9).format(oController.getSessionProperty('DTFMTYYYYMM'));
        this.oDialogModel = new JSONModel(this.getInitialData());
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
            currentListMode: this.sSelectionMode,
            selectedList: [],
            pernrList: [],
          },
        };
      },

      async openDialog(aPernrList = []) {
        if (!this.oCurrentListDialog) {
          const oView = this.oController.getView();

          this.oCurrentListDialog = await Fragment.load({
            id: oView.createId(this.sSelectionMode.toLowerCase()),
            name: 'sap.ui.yesco.mvc.view.nightduty.fragment.CurrentListDialog',
            controller: this,
          });

          oView.addDependent(this.oCurrentListDialog);

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

        this.oDialogModel.setProperty('/dialog/pernrList', aPernrList || []);

        this.oCurrentListDialog.open();
      },

      /**
       *
       */
      initDialogData() {
        if (this.sSelectionMode === SelectionMode.MultiToggle) {
          this.oController.byId(`${this.sSelectionMode.toLowerCase()}--${this.sCurrentListTableId}`).clearSelection();
        }

        const aPernrList = this.oDialogModel.getProperty('/dialog/pernrList');

        this.oDialogModel.setData(this.getInitialData());
        this.oDialogModel.setProperty('/dialog/pernrList', aPernrList || []);
      },

      onChangeYearMonth() {
        this.onPressCurrentListSearch();
      },

      onChangeDutyGroup() {
        this.onPressCurrentListSearch();
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
        const aPernrList = this.oDialogModel.getProperty('/dialog/pernrList');
        const sYearMonth = this.oDialogModel.getProperty('/dialog/yearMonth').replace(/\D/g, '');
        const sSelectedDutyGroup = this.oDialogModel.getProperty('/dialog/selectedDutyGroup');

        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const mFilters = {
          Begmm: sYearMonth, // prettier 방지용 주석
          Endmm: sYearMonth,
          Ocshf: sSelectedDutyGroup,
        };
        if (aPernrList.length) {
          mFilters.Pernr = aPernrList;
        }

        return Client.getEntitySet(oModel, 'OnCallList', mFilters);
      },

      setCurrentListTableData(aCurrentListTableData) {
        this.oDialogModel.setProperty('/dialog/currentList', aCurrentListTableData);
        this.oDialogModel.setProperty('/dialog/currentListRowCount', (aCurrentListTableData || []).length || 1);
        if (this.sSelectionMode === SelectionMode.MultiToggle) {
          this.oDialogModel.setProperty('/dialog/selectedList', []);
          this.oDialogModel.setProperty('/dialog/enabled', false);
        }
      },

      onChangeRowSelection(oEvent) {
        if (this.sSelectionMode !== SelectionMode.MultiToggle) {
          return;
        }

        const oTable = oEvent.getSource();
        const aSelectedIndices = oTable.getSelectedIndices();

        this.oDialogModel.setProperty('/dialog/enabled', aSelectedIndices.length > 0);
        this.oDialogModel.setProperty(
          '/dialog/selectedList',
          aSelectedIndices.map((i) => this.oDialogModel.getProperty(`/dialog/currentList/${i}`))
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
