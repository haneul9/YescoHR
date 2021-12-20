sap.ui.define([
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
], function(
	JSONModel,
	Fragment,
	AppUtils,
	ComboEntry,
	ServiceNames,
	ODataReadError,
	MessageBox,
) {
	"use strict";

	return {
       /*
        *  검색조건 Code
        */
       async setEmpConditionCode(oController) {
        const oEmpModel = oController.getViewModel();
        // const oEmpModel = oController.getOwnerComponent().getModel('employeeModel');

        oEmpModel.setProperty('/employeeModel/busy', true);
        try {
          const aAreaList = await this.setPersAreaCode(oController);
          
          oEmpModel.setProperty('/employeeModel/PersArea', aAreaList);
  
          const aWorkList = await this.setWorkCode(oController);
          
          oEmpModel.setProperty('/employeeModel/WorkType', aWorkList);
  
          const aEmpList = await this.setEmpCode(oController);
          
          oEmpModel.setProperty('/employeeModel/EmpGroup', aEmpList);  
          oEmpModel.setProperty('/employeeModel/SubEmpGroup', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext'}));
          oEmpModel.setProperty('/employeeModel/Search', {
            Persa: 'ALL',
            Ename: '',
            Orgeh: '',
            Stat2: 'ALL',
            Persg: 'ALL',
            Persk: 'ALL',
          });
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oEmpModel.setProperty('/employeeModel/busy', false);
        }
       },

       /*
        *  인사영역 Code
        */
       setPersAreaCode(oController) {
        const oModel = oController.getModel(ServiceNames.COMMON);
        const sUrl = '/PersAreaListSet';

        return new Promise((resolve, reject) => {
          // 인사영역
          oModel.read(sUrl, {
            filters: [],
            success: (oData) => {
              if (oData) {
                oController.debug(`${sUrl} success.`, oData);

                resolve(new ComboEntry({ codeKey: 'Werks', valueKey: 'Pbtxt', aEntries: oData.results }));
              }
            },
            error: (oError) => {
              oController.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        })
       },

       /*
        *  재직구분 Code
        */
       setWorkCode(oController) {
        const oModel = oController.getModel(ServiceNames.COMMON);
        const sUrl = '/EmpCodeListSet';

        return new Promise((resolve, reject) => {
          // 재직구분
          oModel.read(sUrl, {
            filters: [
              new sap.ui.model.Filter('Field', sap.ui.model.FilterOperator.EQ, 'STAT2'),
            ],
            success: (oData) => {
              if (oData) {
                oController.debug(`${sUrl} success.`, oData);

                resolve(new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: oData.results }));
              }
            },
            error: (oError) => {
              oController.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        })
       },
       
       /*
        *  사원그룹 Code
        */
       setEmpCode(oController) {
        const oModel = oController.getModel(ServiceNames.COMMON);
        const sUrl = '/EmpCodeListSet';

        return new Promise((resolve, reject) => {
          // 사원그룹
          oModel.read(sUrl, {
            filters: [
              new sap.ui.model.Filter('Field', sap.ui.model.FilterOperator.EQ, 'PERSG'),
            ],
            success: (oData) => {
              if (oData) {
                oController.debug(`${sUrl} success.`, oData);

                resolve(new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: oData.results }));
              }
            },
            error: (oError) => {
              oController.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        })
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
        // 사원하위
        oModel.read(sUrl, {
          filters: [
            new sap.ui.model.Filter('Field', sap.ui.model.FilterOperator.EQ, 'PERSG'),
            new sap.ui.model.Filter('Excod', sap.ui.model.FilterOperator.EQ, sKey),
          ],
          success: (oData) => {
            if (oData) {
              const aList = oData.results;

              this.debug(`${sUrl} success.`, oData);
              oEmpModel.setProperty('/SubEmpGroup', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));
            }
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);
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
        const vEname = !mSearchData.Ename ? '' : new sap.ui.model.Filter('Ename', sap.ui.model.FilterOperator.EQ, mSearchData.Ename);
        const vOrgeh = !mSearchData.Orgeh ? '' : new sap.ui.model.Filter('Orgeh', sap.ui.model.FilterOperator.EQ, mSearchData.Orgeh);
        const vPersa = mSearchData.Persa === 'ALL' || !mSearchData.Persa ? '' : new sap.ui.model.Filter('Persa', sap.ui.model.FilterOperator.EQ, mSearchData.Persa);
        const vStat2 = mSearchData.Stat2 === 'ALL' || !mSearchData.Stat2 ? '' : new sap.ui.model.Filter('Stat2', sap.ui.model.FilterOperator.EQ, mSearchData.Stat2);
        const vPersg = mSearchData.Persg === 'ALL' || !mSearchData.Persg ? '' : new sap.ui.model.Filter('Persg', sap.ui.model.FilterOperator.EQ, mSearchData.Persg);
        const vPersk = mSearchData.Persk === 'ALL' || !mSearchData.Persk ? '' : new sap.ui.model.Filter('Persk', sap.ui.model.FilterOperator.EQ, mSearchData.Persk);
        const aFilters = [new sap.ui.model.Filter('Menid', sap.ui.model.FilterOperator.EQ, sMenid)];
        
        if (!!vEname) {aFilters.push(vEname);}
        if (!!vOrgeh) {aFilters.push(vOrgeh);}
        if (!!vPersa) {aFilters.push(vPersa);}
        if (!!vStat2) {aFilters.push(vStat2);}
        if (!!vPersg) {aFilters.push(vPersg);}
        if (!!vPersk) {aFilters.push(vPersk);}

        oEmpModel.setProperty('/empList', []);
        oEmpModel.setProperty('/empList/length', 1);
        oEmpModel.setProperty('/busy', true);

        // 사원검색
        oModel.read(sUrl, {
          filters: aFilters,
          success: (oData) => {
            if (oData) {
              const aList = oData.results;
              const iLength = aList.length;

              this.debug(`${sUrl} success.`, oData);
              oEmpModel.setProperty('/empList', aList);
              oEmpModel.setProperty('/empList/length', iLength > 13 ? 13 : iLength);
            }
            oEmpModel.setProperty('/busy', false);
          },
          error: (oError) => {
            this.debug(`${sUrl} error.`, oError);
            AppUtils.handleError(new ODataReadError(oError));
            oEmpModel.setProperty('/busy', false);
          },
        });
      },

      /*
       *  선택버튼
       */
      onSelectClick(oEvent) {
        const oAppModel = this.getViewModel('appointeeModel');
        const oEmpModel = this.getOwnerComponent().getModel('employeeModel');
        
        oAppModel.setProperty('/appointeeModel', oEmpModel.getProperty('/SelectedEmp/0'));
        oEvent.getSource().getParent().close();
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
        const oEmpModel = this.getOwnerComponent().getModel('employeeModel');

        if (!aSelected) return;

        if (aSelected.length > 1) {
          oEventSource.clearSelection();
          return MessageBox.alert(this.getBundleText('MSG_00029'));
        }
        
        const aDeleteDatas = [];
        
        oEmpModel.setProperty('/SelectedEmp', []);

        aSelected.forEach((e) => {
          aDeleteDatas.push(oEmpModel.getProperty(`/empList/${e}`));
        });

        oEmpModel.setProperty('/SelectedEmp', aDeleteDatas);
      },

       /*
        *  사원검색 Dialog호출
        */
      async onSearchDialog() {
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
        this.setViewModel(new JSONModel({ 
          employeeModel: {
            Search: {},
            SelectedEmp: [],
            empList: [],
            PersArea: [],
            WorkType: [],
            EmpGroup: [],
            SubEmpGroup: [],
          }
        }));
           
        if (!this.dSearchDialog) {
            this.dSearchDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.fragment.EmployeeSearch',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          
        this.dSearchDialog.then(function (oDialog) {
          oDialog.open();
        });
        this.EmployeeSearch.setEmpConditionCode(this);
      },

       /*
        *  조직검색 Dialog호출
        */
      onGroupDetail() {
           const oView = this.getView();

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
});