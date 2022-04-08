sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    MessageBox
  ) => {
    'use strict';

    return {
      /*
       *  검색조건 Code
       */
      async setEmpConditionCode(oController) {
        const oEmpModel = oController.getViewModel();

        oEmpModel.setProperty('/employeeModel/busy', true);
        try {
          const oModel = oController.getModel(ServiceNames.COMMON);
          const mPersaFilters = {};
          const sAccty = oEmpModel.getProperty('/employeeModel/Search/Accty') || _.noop();
          const sStat2 = oEmpModel.getProperty('/employeeModel/Search/Stat2') || 'ALL';

          // Accty === 'Z' 일때 PersAreaList 필터조건 ZALL = 'X'
          if (sAccty === 'Z') {
            mPersaFilters.Zall = 'X';
          }

          const [aAreaList, aWorkList, aEmpList] = await Promise.all([
            Client.getEntitySet(oModel, 'PersAreaList', mPersaFilters), //
            Client.getEntitySet(oModel, 'EmpCodeList', { Field: 'STAT2' }),
            Client.getEntitySet(oModel, 'EmpCodeList', { Field: 'PERSG' }),
          ]);

          oEmpModel.setProperty('/employeeModel/PersArea', new ComboEntry({ codeKey: 'Werks', valueKey: 'Pbtxt', aEntries: aAreaList }));
          oEmpModel.setProperty('/employeeModel/WorkType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aWorkList }));
          oEmpModel.setProperty('/employeeModel/EmpGroup', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aEmpList }));
          oEmpModel.setProperty('/employeeModel/SubEmpGroup', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));
          oEmpModel.setProperty('/employeeModel/Search', {
            Accty: sAccty,
            Persa: 'ALL',
            Ename: _.noop(),
            Orgeh: _.noop(),
            Stat2: sStat2,
            Persg: 'ALL',
            Persk: 'ALL',
          });

          return true;
        } catch (oError) {
          AppUtils.handleError(oError);
          return false;
        } finally {
          oEmpModel.setProperty('/employeeModel/busy', false);
        }
      },

      /*
       *  사원하위그룹 Code
       */
      async onSubEmpCode(oEvent) {
        const oEmpModel = this.getViewModel();

        try {
          const sKey = oEvent.getSource().getSelectedKey();

          oEmpModel.setProperty('/employeeModel/Search/Persk', 'ALL');

          if (!sKey || sKey === 'ALL') return;

          const aSubEmpGroups = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpCodeList', {
            Field: 'PERSK',
            Excod: sKey,
          });

          oEmpModel.setProperty('/employeeModel/SubEmpGroup', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aSubEmpGroups }));
        } catch (oError) {
          this.debug('Common > EmployeeSearch > onSubEmpCode Error', oError);

          AppUtils.handleError(oError);
        }
      },

      /*
       *  조직검색
       */
      async onOrgList() {
        const oEmpModel = this.getViewModel();

        oEmpModel.setProperty('/employeeModel/org/busy', true);

        try {
          const oOrgTable = AppUtils.getAppComponent().byId(`${this.getView().getId()}GroupDetail--orgTable`);
          oOrgTable.clearSelection();

          const { Persa: Werks, Date: Datum, Word: Stext } = oEmpModel.getProperty('/employeeModel/org');
          const aOrgResults = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'OrgList', {
            Werks,
            Stext,
            Datum: moment(Datum).hours(9).toDate(),
          });

          oEmpModel.setProperty('/employeeModel/org/orgList', aOrgResults);
          oEmpModel.setProperty('/employeeModel/org/orgListLength', Math.min(aOrgResults.length, 4));
        } catch (oError) {
          this.debug('Common > EmployeeSearch > onOrgList Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oEmpModel.setProperty('/employeeModel/org/busy', false);
        }
      },

      /*
       *  검색버튼
       */
      async onEmpSearch() {
        const oEmpModel = this.getViewModel();

        oEmpModel.setProperty('/employeeModel/busy', true);
        oEmpModel.setProperty('/employeeModel/empList', []);
        oEmpModel.setProperty('/employeeModel/empListLength', 1);

        try {
          this.byId('empTable').clearSelection();

          const mSearchConditions = oEmpModel.getProperty('/employeeModel/Search');
          const aResults = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
            Menid: this.getCurrentMenuId(),
            ..._.pick(mSearchConditions, ['Ename', 'Orgeh', 'Accty', 'Persa', 'Stat2', 'Persg', 'Persk']),
          });

          oEmpModel.setProperty('/employeeModel/empList', aResults);
          oEmpModel.setProperty('/employeeModel/empListLength', Math.min(aResults.length, 15));
        } catch (oError) {
          this.debug('Common > EmployeeSearch > onEmpSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oEmpModel.setProperty('/employeeModel/busy', false);
        }
      },

      /*
       *  선택버튼
       */
      onSelectClick(oEvent) {
        const oEmpModel = this.getViewModel();
        const aSelectedEmp = oEmpModel.getProperty('/employeeModel/SelectedEmp');

        if (!aSelectedEmp.length) {
          return MessageBox.alert(this.getBundleText('MSG_00050'));
        }

        const oAppModel = this.getViewModel('appointeeModel');
        oAppModel.setData({ ...aSelectedEmp[0], Werks: aSelectedEmp[0].Persa, Orgtx: aSelectedEmp[0].Fulln }, true);
        oEvent.getSource().getParent().close();
        this.onRefresh(aSelectedEmp[0]);
      },

      /*
       *  닫기버튼
       */
      onCloseClick(oEvent) {
        oEvent.getSource().getParent().close();
      },

      /*
       *  검색결과 Table checkBox선택
       */
      onRowSelection(oEvent) {
        const oEventSource = oEvent.getSource();
        const aSelected = oEventSource.getSelectedIndices();
        const oEmpModel = this.getViewModel();

        if (!aSelected) return;

        if (aSelected.length > 1) {
          oEventSource.clearSelection();
          return MessageBox.alert(this.getBundleText('MSG_00029'));
        }

        const aSelectionDatas = [];

        oEmpModel.setProperty('/employeeModel/SelectedEmp', []);

        aSelected.forEach((e) => {
          aSelectionDatas.push(oEmpModel.getProperty(`/employeeModel/empList/${e}`));
        });

        oEmpModel.setProperty('/employeeModel/SelectedEmp', aSelectionDatas);
      },

      /*
       *  조직검색 Table checkBox선택
       */
      onOrgListRowSelection(oEvent) {
        const oEventSource = oEvent.getSource();
        const aSelected = oEventSource.getSelectedIndices();
        const oEmpModel = this.getViewModel();
        const iSelectedRowIndex = oEvent.getParameter('rowIndex');

        if (!aSelected) return;

        oEventSource.setSelectionInterval(iSelectedRowIndex, iSelectedRowIndex);

        oEmpModel.setProperty('/employeeModel/org/SelectedOrg', [oEmpModel.getProperty(`/employeeModel/org/orgList/${iSelectedRowIndex}`)]);
      },

      /*
       *  조직선택버튼
       */
      onOrgClick(oEvent) {
        const oEmpModel = this.getViewModel();
        const aSelectedOrg = oEmpModel.getProperty('/employeeModel/org/SelectedOrg');

        if (!aSelectedOrg.length) {
          // return MessageBox.alert(this.getBundleText('MSG_00004', 'LABEL_00228'));
        }

        oEmpModel.setProperty('/employeeModel/Search/Pbtxt', _.isEmpty(aSelectedOrg) ? '' : aSelectedOrg[0].Stext);
        oEmpModel.setProperty('/employeeModel/Search/Orgeh', _.isEmpty(aSelectedOrg) ? null : aSelectedOrg[0].Orgeh);
        oEvent.getSource().getParent().close();
      },

      /*
       *  사원검색 Dialog호출
       */
      async onSearchDialog(fnCallback, mInitModelData = {}) {
        const oView = this.getView();
        const mModelData = {
          Search: {},
          Enabled: {},
          SelectedEmp: [],
          empList: [],
          PersArea: [],
          WorkType: [],
          EmpGroup: [],
          SubEmpGroup: [],
        };

        this.getViewModel().setProperty('/employeeModel', $.extend(true, mModelData, mInitModelData));

        if (!this.dSearchDialog) {
          this.dSearchDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.fragment.EmployeeSearch',
            controller: this,
          });

          oView.addDependent(this.dSearchDialog);

          this.dSearchDialog
            .attachBeforeOpen(() => {
              this.byId('empTable').clearSelection();
            })
            .attachBeforeClose((oEvent) => {
              if (fnCallback && typeof fnCallback === 'function') {
                const [mSelectedEmp] = this.getViewModel().getProperty('/employeeModel/SelectedEmp') || [];
                const bClickedCloseButton = oEvent.getParameter('origin').getProperty('text') === AppUtils.getBundleText('LABEL_00115');

                fnCallback.call(this, mSelectedEmp || {}, bClickedCloseButton);
              }
            });
        }

        this.dSearchDialog.open();

        return this.EmployeeSearch.setEmpConditionCode(this);
      },

      /*
       *  조직검색 Dialog호출
       */
      async onGroupDetail() {
        const oView = this.getView();

        this.getViewModel().setProperty('/employeeModel/org', {
          Date: moment().toDate(),
          Word: '',
          orgListLength: 1,
          orgList: [],
          SelectedOrg: [],
          busy: false,
        });

        if (!this.dGroupDialog) {
          this.dGroupDialog = await Fragment.load({
            id: `${oView.getId()}GroupDetail`,
            name: 'sap.ui.yesco.fragment.GroupDetail',
            controller: this,
          });

          this.dGroupDialog.attachAfterOpen(() => {
            this.EmployeeSearch.onOrgList.call(this);
          });

          oView.addDependent(this.dGroupDialog);
        }

        this.dGroupDialog.open();
      },
    };
  }
);
