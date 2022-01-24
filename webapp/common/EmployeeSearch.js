sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    ODataReadError,
    MessageBox
  ) => {
    'use strict';

    return {
      /*
       *  검색조건 Code
       */
      async setEmpConditionCode(oController) {
        const oEmpModel = oController.getViewModel();
        // const oEmpModel = oController.getOwnerComponent().getModel('employeeModel');

        oEmpModel.setProperty('/employeeModel/busy', true);
        try {
          const oModel = oController.getModel(ServiceNames.COMMON);

          const [aAreaList, aWorkList, aEmpList] = await Promise.all([
            Client.getEntitySet(oModel, 'PersAreaList'), //
            Client.getEntitySet(oModel, 'EmpCodeList', { Field: 'STAT2' }),
            Client.getEntitySet(oModel, 'EmpCodeList', { Field: 'PERSG' }),
          ]);

          oEmpModel.setProperty('/employeeModel/PersArea', new ComboEntry({ codeKey: 'Werks', valueKey: 'Pbtxt', aEntries: aAreaList }));
          oEmpModel.setProperty('/employeeModel/WorkType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aWorkList }));
          oEmpModel.setProperty('/employeeModel/EmpGroup', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aEmpList }));
          oEmpModel.setProperty('/employeeModel/SubEmpGroup', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext' }));
          oEmpModel.setProperty('/employeeModel/Search', {
            Persa: 'ALL',
            Ename: '',
            Orgeh: '',
            Stat2: 'ALL',
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
      onSubEmpCode(oEvent) {
        const oModel = this.getModel(ServiceNames.COMMON);
        const oEmpModel = this.getViewModel();
        const sKey = oEvent.getSource().getSelectedKey();
        const sUrl = '/EmpCodeListSet';

        oEmpModel.setProperty('/employeeModel/Search/Persk', 'ALL');

        if (!sKey || sKey === 'ALL') return;

        // 사원하위
        oModel.read(sUrl, {
          filters: [
            new Filter('Field', FilterOperator.EQ, 'PERSG'), //
            new Filter('Excod', FilterOperator.EQ, sKey),
          ],
          success: (oData) => {
            if (oData) {
              const aList = oData.results;

              this.debug(`${sUrl} success.`, oData);
              oEmpModel.setProperty('/employeeModel/SubEmpGroup', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));
            }
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      /*
       *  조직검색
       */
      onOrgList() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const oEmpModel = this.getViewModel();
        const mSearchData = oEmpModel.getProperty('/employeeModel/org');
        const sUrl = '/OrgListSet';
        const vDate = !mSearchData.Date ? '' : new Filter('Datum', FilterOperator.EQ, mSearchData.Date);
        const vStext = !mSearchData.Word ? '' : new Filter('Stext', FilterOperator.EQ, mSearchData.Word);
        const oOrgTable = AppUtils.getAppComponent().byId(`${this.getView().getId()}GroupDetail--orgTable`);
        const aFilters = [];

        oOrgTable.clearSelection();
        oEmpModel.setProperty('/employeeModel/org/busy', true);

        if (!!vDate) {
          aFilters.push(vDate);
        }
        if (!!vStext) {
          aFilters.push(vStext);
        }

        // 사원그룹
        oModel.read(sUrl, {
          filters: aFilters,
          success: (oData) => {
            if (oData) {
              const aList = oData.results;
              const iLength = aList.length;

              this.debug(`${sUrl} success.`, oData);
              oEmpModel.setProperty('/employeeModel/org/orgList', aList);
              oEmpModel.setProperty('/employeeModel/org/orgListLength', iLength > 4 ? 4 : iLength);
            }
            oEmpModel.setProperty('/employeeModel/org/busy', false);
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);

            oEmpModel.setProperty('/employeeModel/org/busy', false);
            AppUtils.handleError(new ODataReadError(oError));
          },
        });
      },

      /*
       *  검색버튼
       */
      onEmpSearch() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const oEmpModel = this.getViewModel();
        const sMenid = this.getCurrentMenuId();
        const sUrl = '/EmpSearchResultSet';
        const mSearchData = oEmpModel.getProperty('/employeeModel/Search');
        const vEname = !mSearchData.Ename ? '' : new Filter('Ename', FilterOperator.EQ, mSearchData.Ename);
        const vOrgeh = !mSearchData.Orgeh ? '' : new Filter('Orgeh', FilterOperator.EQ, mSearchData.Orgeh);
        const vPersa = mSearchData.Persa === 'ALL' || !mSearchData.Persa ? '' : new Filter('Persa', FilterOperator.EQ, mSearchData.Persa);
        const vStat2 = mSearchData.Stat2 === 'ALL' || !mSearchData.Stat2 ? '' : new Filter('Stat2', FilterOperator.EQ, mSearchData.Stat2);
        const vPersg = mSearchData.Persg === 'ALL' || !mSearchData.Persg ? '' : new Filter('Persg', FilterOperator.EQ, mSearchData.Persg);
        const vPersk = mSearchData.Persk === 'ALL' || !mSearchData.Persk ? '' : new Filter('Persk', FilterOperator.EQ, mSearchData.Persk);
        const aFilters = [new Filter('Menid', FilterOperator.EQ, sMenid)];

        if (!!vEname) {
          aFilters.push(vEname);
        }
        if (!!vOrgeh) {
          aFilters.push(vOrgeh);
        }
        if (!!vPersa) {
          aFilters.push(vPersa);
        }
        if (!!vStat2) {
          aFilters.push(vStat2);
        }
        if (!!vPersg) {
          aFilters.push(vPersg);
        }
        if (!!vPersk) {
          aFilters.push(vPersk);
        }

        oEmpModel.setProperty('/employeeModel/empList', []);
        oEmpModel.setProperty('/employeeModel/empListLength', 1);
        oEmpModel.setProperty('/employeeModel/busy', true);
        this.byId('empTable').clearSelection();

        // 사원검색
        oModel.read(sUrl, {
          filters: aFilters,
          success: (oData) => {
            if (oData) {
              const aList = oData.results;
              const iLength = aList.length;

              this.debug(`${sUrl} success.`, oData);
              oEmpModel.setProperty('/employeeModel/empList', aList);
              oEmpModel.setProperty('/employeeModel/empListLength', iLength > 13 ? 13 : iLength);
            }
            oEmpModel.setProperty('/employeeModel/busy', false);
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);
            AppUtils.handleError(new ODataReadError(oError));
            oEmpModel.setProperty('/employeeModel/busy', false);
          },
        });
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
        oAppModel.setData(aSelectedEmp[0], true);
        oAppModel.setProperty('/Orgtx', aSelectedEmp[0].Fulln);
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

        if (!aSelected) return;

        if (aSelected.length > 1) {
          oEventSource.clearSelection();
          return MessageBox.alert(this.getBundleText('MSG_00028'));
        }

        const aSelectionDatas = [];

        oEmpModel.setProperty('/employeeModel/org/SelectedOrg', []);

        aSelected.forEach((e) => {
          aSelectionDatas.push(oEmpModel.getProperty(`/employeeModel/org/orgList/${e}`));
        });

        oEmpModel.setProperty('/employeeModel/org/SelectedOrg', aSelectionDatas);
      },

      /*
       *  조직선택버튼
       */
      onOrgClick(oEvent) {
        const oEmpModel = this.getViewModel();
        const aSelectedOrg = oEmpModel.getProperty('/employeeModel/org/SelectedOrg');

        if (!aSelectedOrg.length) {
          return MessageBox.alert(this.getBundleText('MSG_00004', 'LABEL_00228'));
        }

        oEmpModel.setProperty('/employeeModel/Search/Pbtxt', aSelectedOrg[0].Stext);
        oEmpModel.setProperty('/employeeModel/Search/Orgeh', aSelectedOrg[0].Orgeh);
        oEvent.getSource().getParent().close();
      },

      /*
       *  사원검색 Dialog호출
       */
      async onSearchDialog(fnCallback) {
        const oView = this.getView();

        // this.getOwnerComponent().setModel(new JSONModel({
        //   Search: {},
        //   SelectedEmp: [],
        //   empList: [],
        //   PersArea: [],
        //   WorkType: [],
        //   EmpGroup: [],
        //   SubEmpGroup: [],
        // }), 'employeeModel');
        this.getViewModel().setProperty('/employeeModel', {
          Search: {},
          Enabled: {},
          SelectedEmp: [],
          empList: [],
          PersArea: [],
          WorkType: [],
          EmpGroup: [],
          SubEmpGroup: [],
        });

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
                const aSelectedEmp = this.getViewModel().getProperty('/employeeModel/SelectedEmp') || [];
                const bClickedCloseButton = oEvent.getParameter('origin').getProperty('text') === AppUtils.getBundleText('LABEL_00115');

                fnCallback(aSelectedEmp[0] || {}, bClickedCloseButton);
              }
            });
        }

        this.dSearchDialog.open();

        return this.EmployeeSearch.setEmpConditionCode(this);
      },

      /*
       *  조직검색 Dialog호출
       */
      onGroupDetail() {
        const oView = this.getView();

        this.getViewModel().setProperty('/employeeModel/org', {
          Date: '',
          Word: '',
          orgListLength: 1,
          orgList: [],
          SelectedOrg: [],
          busy: false,
        });

        if (!this.dGroupDialog) {
          this.dGroupDialog = Fragment.load({
            id: `${oView.getId()}GroupDetail`,
            name: 'sap.ui.yesco.fragment.GroupDetail',
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }

        this.dGroupDialog.then(function (oDialog) {
          oDialog.open();
        });
      },
    };
  }
);
