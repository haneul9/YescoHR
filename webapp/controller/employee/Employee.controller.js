sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/ui/table/Table',
    'sap/ui/layout/cssgrid/CSSGrid',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/appUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/extension/moment',
    'sap/ui/yesco/extension/lodash',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    Fragment,
    Table,
    CSSGrid,
    BaseController,
    ServiceNames,
    appUtils,
    TableUtils,
    Validator,
    MessageBox
  ) => {
    'use strict';

    class Employee extends BaseController {
      constructor() {
        super();
        this.formatter = TableUtils;
        this.validator = Validator;
      }

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          pernr: null,
          navigation: {
            current: '사원프로파일',
            links: [
              { name: '인사' }, //
            ],
          },
          sideNavigation: {
            isShow: true,
            width: '22%',
            search: {
              searchText: '',
              selectedState: '3',
              results: [],
            },
            treeLoaded: false,
            treeData: [],
          },
          employee: {
            width: '78%',
            busy: true,
            header: {
              profilePath: 'https://i1.wp.com/jejuhydrofarms.com/wp-content/uploads/2020/05/blank-profile-picture-973460_1280.png?ssl=1',
              baseInfo: [],
              timeline: [
                { label: '회사입사일', data: '2010.01.01' },
                { label: '부서배치일', data: '2015.01.01' },
                { label: '직급승진일', data: '2016.01.01' },
                { label: '직책임용일', data: '2010.01.01' },
                { label: '10년장기근속일', data: '2019.12.31' },
              ],
            },
            tab: {
              list: [],
            },
            sub: {},
            address: {
              typeList: [{ Zcode: 'ALL', Ztext: this.getText('LABEL_00268') }],
              sidoList: [{ State: 'ALL', Bezei: this.getText('LABEL_00268') }],
              form: { Subty: 'ALL', State: 'ALL' },
            },
          },
        });
        this.setViewModel(oViewModel);

        const oRouter = this.getRouter();
        oRouter.getRoute('employee').attachPatternMatched(this.onObjectMatched, this);
      }

      onObjectMatched(oEvent) {
        const oParameter = oEvent.getParameter('arguments');
        const oViewModel = this.getView().getModel();
        const sPernr = oParameter.pernr || this.getModel('sessionModel').getProperty('/Pernr');

        oViewModel.setProperty('/employee/busy', true);
        oViewModel.setProperty('/pernr', sPernr);

        this.initialList({ oViewModel, sPernr });
        this.loadProfile({ oViewModel, sPernr });
      }

      async initialList({ oViewModel, sPernr }) {
        const oSideList = this.byId('sideEmployeeList');
        const oStatFilter = new Filter('Stat2', FilterOperator.EQ, '3');
        const oSessionData = this.getModel('sessionModel').getData();
        const oSearchParam = {
          searchText: sPernr || oSessionData.Pernr,
          ...oSessionData,
        };

        const oSearchResults = await this.readEmpSearchResult({ oSearchParam });

        oViewModel.setProperty('/sideNavigation/search/results', oSearchResults);
        oSideList.getBinding('items').filter([oStatFilter]);
      }

      async loadProfile({ oViewModel, sPernr }) {
        const oViewModelData = oViewModel.getData();
        const oModel = this.getModel(ServiceNames.PA);
        let aFilters = [];
        let aHeaderRequests = [];
        let aContentRequests = [];

        if (sPernr) {
          aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
        }

        try {
          // 1. 상단 프로필, 탭 메뉴, 주소유형, 시/도
          const [oProfileReturnData, mMenuReturnData, mAddressTypeData, mAddressCityData] = await Promise.all([
            this.readEmpProfileHeaderNew({ oModel, aFilters }), //
            this.readEmpProfileMenu({ oModel, aFilters }),
            this.readTypeList({ oModel }),
            this.readCityList({ oModel, sPernr }),
          ]);

          // 주소유형 & 시/도
          oViewModel.setProperty('/employee/address/typeList', mAddressTypeData);
          oViewModel.setProperty('/employee/address/sidoList', mAddressCityData);
          //End 주소유형 & 시/도

          // 상단 프로필 Set
          const { Pturl, ...oReturnData } = oProfileReturnData;
          delete oReturnData.Pernr;
          delete oReturnData.Langu;
          delete oReturnData.Prcty;
          delete oReturnData.Actty;
          delete oReturnData.__metadata;
          const aConvertData = Object.keys(oReturnData).map((key) => ({ data: oReturnData[key] }));

          oViewModel.setProperty('/employee/header/profilePath', Pturl);
          oViewModel.setProperty('/employee/header/baseInfo', aConvertData);
          //End 상단 프로필 Set

          // 탭 메뉴 Set
          const aTabMenus = _.filter(mMenuReturnData, { Child: '1' }).map((obj, index) => ({ Pressed: index === 0, ...obj }));
          const aSubMenus = mMenuReturnData.filter((data) => data.Child !== '1');

          oViewModel.setProperty('/employee/tab/list', aTabMenus);
          oViewModel.setProperty('/employee/tab/menu', aSubMenus);

          aTabMenus.forEach((data) => {
            this.debug(`Tab ${data.Menu1}`, data);
            oViewModelData.employee.sub[data.Menuc1] = { isShow: data.Pressed, contents: {} };
          });

          aSubMenus.forEach((data) => {
            oViewModelData.employee.sub[data.Menuc1].contents[data.Menuc2] = {
              type: data.Child,
              rowCount: 1,
              selectionMode: data.Menu2 === '주소' ? 'MultiToggle' : 'None',
              title: data.Menu2,
              sort: data.Sorts,
              header: [],
              data: [],
            };
          });
          //End 탭 메뉴 Set

          aTabMenus.map((data) => {
            aHeaderRequests.push(this.readEmpProfileHeaderTab({ oModel, aFilters: [new Filter('Menuc', FilterOperator.EQ, data.Menuc1), ...aFilters] }));
            aContentRequests.push(this.readEmpProfileContentsTab({ oModel, aFilters: [new Filter('Menuc', FilterOperator.EQ, data.Menuc1), ...aFilters] }));
          });

          // 2. Sub 영역 조회[header, contents]
          const aHeaderReturnData = await Promise.all(aHeaderRequests);
          const aContentReturnData = await Promise.all(aContentRequests);

          // Header 영역 Set
          aHeaderReturnData.forEach((headers, index) => {
            headers.forEach((o) => {
              oViewModelData.employee.sub[aTabMenus[index].Menuc1].contents[o.Menuc].header.push(o);
            });
          });
          //End Header 영역 Set

          // Contents 영역 Set
          aContentReturnData.forEach((content, index) => {
            content.forEach((o) => {
              let oSubMenu = oViewModelData.employee.sub[aTabMenus[index].Menuc1].contents[o.Menuc];

              if (oSubMenu.type === '6') {
                for (let i = 1; i <= oSubMenu.header.length; i++) {
                  let sKey = `Value${_.padStart(i, 2, '0')}`;
                  oSubMenu.data.push(o[sKey]);
                }
              } else if (oSubMenu.type === '5') {
                oSubMenu.data.push(o);
              }

              oSubMenu.rowCount = oSubMenu.data.length;
            });
          });
          //End Contents 영역 Set

          oViewModel.setData(oViewModelData);

          // Sub 영역 UI5 Control 생성
          this.makeProfileBody();
        } catch (oError) {
          this.debug('Controller > Employee > loadProfile Error', oError);

          MessageBox.error(this.getText('MSG_00008', '조회'));
        } finally {
          oViewModel.setProperty('/employee/busy', false);
        }
      }

      makeProfileBody() {
        const oView = this.getView().getModel();
        const oParentBox = this.byId('profileBody');
        const mSubMenu = oView.getProperty('/employee/sub');

        Object.keys(mSubMenu).forEach((menuKey) => {
          let mSubMenuContents = mSubMenu[menuKey].contents;
          let oVBox = sap.ui.getCore().byId(`sub${menuKey}`);

          if (oVBox) {
            oVBox.destroyItems();
            oParentBox.removeItem(oVBox);
          } else {
            oVBox = new sap.m.VBox({ id: `sub${menuKey}`, visible: { path: `/employee/sub/${menuKey}/isShow` } });
          }

          /**
           * OMenu.type: '5'  Table
           *      - 주소 테이블의 경우 CRUD가 추가된다.
           * OMenu.type: '6'  Grid
           */
          Object.keys(mSubMenuContents).forEach((key) => {
            let oMenu = mSubMenuContents[key];
            let oSubVBox = new sap.m.VBox().addStyleClass('customBox');
            let oSubHBox = new sap.m.HBox({ justifyContent: 'SpaceBetween' });
            this.debug(`Sub ${oMenu.title}`, oMenu);

            oSubHBox.addItem(new sap.m.Title({ level: 'H2', text: oMenu.title }));
            if (oMenu.title === '주소') {
              let oSubButtonBox = new sap.m.HBox();

              oSubButtonBox.addItem(new sap.m.Button({ type: 'Transparent', width: '117px', icon: 'sap-icon://edit', text: '수정', press: this.onPressModifyAddress.bind(this) }));
              oSubButtonBox.addItem(new sap.m.Button({ type: 'Transparent', width: '117px', icon: 'sap-icon://add', text: '추가', press: this.onPressRegAddress.bind(this) }));
              oSubButtonBox.addItem(new sap.m.Button({ type: 'Transparent', width: '117px', icon: 'sap-icon://less', text: '삭제', press: this.onPressDeleteAddress.bind(this) }));
              oSubHBox.addItem(oSubButtonBox);
            }

            oSubVBox.addItem(oSubHBox);

            if (oMenu.type === '5') {
              let oTable = new Table({
                width: '100%',
                selectionMode: { path: `/employee/sub/${menuKey}/contents/${key}/selectionMode` },
                visibleRowCount: { path: `/employee/sub/${menuKey}/contents/${key}/rowCount` },
                noData: this.getText('MSG_00001'),
              }).bindRows(`/employee/sub/${menuKey}/contents/${key}/data`);

              oMenu.header.forEach((head, index) => {
                if (!head.Invisible) {
                  let oColumn = new sap.ui.table.Column({ width: 'auto' });

                  oColumn.setLabel(new sap.m.Label({ text: head.Header }));
                  oColumn.setTemplate(new sap.m.Text({ width: '100%', textAlign: 'Center', text: { path: `Value${_.padStart(index + 1, 2, '0')}` } }));
                  oTable.addColumn(oColumn);
                }
              });

              oSubVBox.addItem(oTable);
            } else if (oMenu.type === '6') {
              let oCSSGrid = new CSSGrid({ gridTemplateColumns: '1fr 3fr 1fr 3fr', gridGap: '2px' });

              oMenu.header.forEach((head, index) => {
                oCSSGrid.addItem(new sap.m.Label({ text: head.Header }));
                oCSSGrid.addItem(new sap.m.Text({ text: oMenu.data[index] }));
              });

              oSubVBox.addItem(oCSSGrid);
            }

            oVBox.addItem(oSubVBox);
          });

          oParentBox.addItem(oVBox);
        });
      }

      openAddressDialog() {
        const oView = this.getView();

        appUtils.setAppBusy(true, this);

        setTimeout(() => {
          if (!this._pAddressDialog) {
            this._pAddressDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.view.employee.fragment.AddressDialog',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }
          this._pAddressDialog.then(function (oDialog) {
            oDialog.open();
          });
        }, 100);
      }

      async refreshAddress({ oViewModel }) {
        const oMenuInfo = _.find(oViewModel.getProperty('/employee/tab/menu'), { Menu2: '주소' });
        const sAddressPath = `/employee/sub/${oMenuInfo.Menuc1}/contents/${oMenuInfo.Menuc2}`;
        const mReturnContents = await this.readEmpProfileContentsTab({
          oModel: this.getModel(ServiceNames.PA),
          aFilters: [
            new Filter('Pernr', FilterOperator.EQ, oMenuInfo.Pernr), //
            new Filter('Menuc', FilterOperator.EQ, oMenuInfo.Menuc1),
          ],
        });
        const mTableData = _.filter(mReturnContents, { Menuc: oMenuInfo.Menuc2 });

        oViewModel.setProperty(`${sAddressPath}/data`, mTableData);
        oViewModel.setProperty(`${sAddressPath}/rowCount`, mTableData.length);
      }

      getAddressTableRowData({ oViewModel, oTable, aSelectedIndices }) {
        const sRowPath = oTable.getRows()[aSelectedIndices[0]].getBindingContext().getPath();
        const oRowData = oViewModel.getProperty(sRowPath);
        const oMenu = _.find(oViewModel.getProperty('/employee/tab/menu'), { Menuc2: oRowData.Menuc });
        const mHeaderData = oViewModel.getProperty(`/employee/sub/${oMenu.Menuc1}/contents/${oMenu.Menuc2}/header`);

        return {
          Pernr: oRowData.Pernr,
          Subty: oRowData[`Value${_.padStart(_.findIndex(mHeaderData, { Fieldname: 'SUBTY' }) + 1, 2, '0')}`],
          Begda: oRowData[`Value${_.padStart(_.findIndex(mHeaderData, { Fieldname: 'BEGDA' }) + 1, 2, '0')}`],
        };
      }

      /**
       * OData에서 받은 데이터를 Tree구조 데이터로 변환한다.
       * 최상위 키는 "00000000"
       * 현재 키(Objid)와 부모 키(PupObjid)를 비교하여 같으면 부모의 nodes에 추가한다.
       * Otype이 "O"(부서)인 경우 nodes를 초기화하고 dummy 아이템을 추가한다.(expand event 발생시 해당 부서의 child nodes를 조회)
       *
       * @param {Array} mReturnTreeData - OData return list
       * @param {number} rootId - "00000000" 또는 부서코드
       * 							"00000000"인 경우 rootNodes를 반환(Model-/TreeData setData)
       * 							부서코드인 경우 rootNodes[0].nodes를 반환(이미 생성된 부모.nodes에 append)
       *
       * @returns {Array<Object>} - Tree data object
       */
      transformTreeData({ mReturnTreeData, rootId }) {
        let rootNodes = [];
        let traverse = (nodes, item, index) => {
          if (nodes instanceof Array) {
            return nodes.some((node) => {
              if (node.Objid === item.ObjidUp) {
                node.nodes = node.nodes || [];

                delete item.__metadata;
                delete item.Datum;
                mReturnTreeData.splice(index, 1);

                let oAddItem = $.extend(true, item, {
                  ref: item.Otype === 'O' ? 'sap-icon://org-chart' : item.Xchif === 'X' ? 'sap-icon://manager' : 'sap-icon://employee',
                });

                if (item.Otype === 'O') {
                  oAddItem.nodes = [{ Stext: '-', dummy: true }];
                }

                return node.nodes.push(oAddItem);
              }

              return traverse(node.nodes, item, index);
            });
          }
        };

        while (mReturnTreeData.length > 0) {
          mReturnTreeData.some((item, index) => {
            if (item.ObjidUp === '00000000') {
              delete item.__metadata;
              delete item.Datum;
              mReturnTreeData.splice(index, 1);

              return rootNodes.push(
                $.extend(true, item, {
                  ref: item.Otype === 'O' ? 'sap-icon://org-chart' : item.Xchif === 'X' ? 'sap-icon://manager' : 'sap-icon://employee',
                })
              );
            }

            return traverse(rootNodes, item, index);
          });
        }

        return rootId !== '00000000' ? rootNodes[0].nodes : rootNodes;
      }

      /* =========================================================== */
      /* event handlers                                              */
      /* =========================================================== */
      onToggleNavigation(oEvent) {
        const bState = oEvent.getParameter('state');

        this.getView().getModel().setProperty('/sideNavigation/isShow', bState);
        this.getView()
          .getModel()
          .setProperty('/sideNavigation/width', bState ? '22%' : '4%');
        this.getView()
          .getModel()
          .setProperty('/employee/width', bState ? '78%' : '96%');
      }

      async onSelectSideTab(oEvent) {
        const oViewModel = this.getView().getModel();
        const sSelectedKey = oEvent.getParameter('key');
        const bTreeLoaded = oViewModel.getProperty('/sideNavigation/treeLoaded');

        if (!bTreeLoaded && sSelectedKey === 'tree') {
          const mReturnTreeData = await this.readAuthOrgTree();
          const mConvertedTreeData = this.transformTreeData({ mReturnTreeData, rootId: '00000000' });

          this.debug('mConvertedTreeData', mConvertedTreeData);
          oViewModel.setProperty('/sideNavigation/treeData', mConvertedTreeData);
        }

        oViewModel.setProperty('/sideNavigation/treeLoaded', true);
      }

      async onChangeStat() {
        const oViewModel = this.getView().getModel();
        const oSideList = this.byId('sideEmployeeList');
        const sStat = oViewModel.getProperty('/sideNavigation/search/selectedState');
        const oStatFilter = new Filter('Stat2', FilterOperator.EQ, sStat);

        oSideList.getBinding('items').filter(!sStat ? [] : [oStatFilter]);
      }

      async onPressEmployeeSearch(oEvent) {
        const oViewModel = this.getView().getModel();
        const oControl = oEvent.getSource();
        const sSearchText = oControl.getValue();
        const oSessionData = this.getModel('sessionModel').getData();
        const oSearchParam = {
          searchText: sSearchText,
          ...oSessionData,
        };

        if (!sSearchText) {
          MessageBox.alert('검색어를 입력하세요.');
          return;
        } else if (sSearchText.length < 2) {
          MessageBox.alert('검색어를 두 글자 이상 입력하세요.');
          return;
        }

        const oSearchResults = await this.readEmpSearchResult({ oSearchParam });

        oViewModel.setProperty('/sideNavigation/search/results', oSearchResults);
      }

      onClickEmployeeCard(oEvent) {
        const sPath = oEvent.getSource().getBindingContext().getPath();
        const oViewModel = this.getView().getModel();
        const sPrevPernr = oViewModel.getProperty('/pernr');
        const sPernr = oViewModel.getProperty(`${sPath}/Pernr`);

        if (!sPernr) {
          MessageBox.error('선택된 사번이 없습니다.');
          return;
        } else if (sPrevPernr === sPernr) {
          return;
        }

        oViewModel.setProperty('/employee/busy', true);
        oViewModel.setProperty('/pernr', sPernr);

        this.loadProfile({ oViewModel, sPernr });
      }

      onSelectTreeItem(oEvent) {
        const oViewModel = this.getView().getModel();
        const oSelectContext = oEvent.getParameter('listItem').getBindingContext();
        const oSelectedItem = oSelectContext.getProperty();
        const sPernr = oSelectedItem.Objid;

        this.debug('oSelectedItem', oSelectedItem);

        if (oSelectedItem.Otype === 'P') {
          oViewModel.setProperty('/employee/busy', true);
          oViewModel.setProperty('/pernr', sPernr);

          this.loadProfile({ oViewModel, sPernr });
        }
      }

      onToggleTab(oEvent) {
        const oViewModel = this.getView().getModel();
        const aSubTabs = oViewModel.getProperty('/employee/sub');
        const sSelectedKey = oEvent.getParameter('key');

        Object.keys(aSubTabs).forEach((subId) => {
          if (subId === sSelectedKey) {
            oViewModel.setProperty(`/employee/sub/${subId}/isShow`, true);
          } else {
            oViewModel.setProperty(`/employee/sub/${subId}/isShow`, false);
          }
        });
      }

      onPressRegAddress() {
        const oViewModel = this.getView().getModel();

        oViewModel.setProperty('/employee/address/actionText', '추가');
        oViewModel.setProperty('/employee/address/form', { Subty: 'ALL', State: 'ALL' });

        this.openAddressDialog();
      }

      async onSaveAddress() {
        const oViewModel = this.getView().getModel();
        const oInputData = oViewModel.getProperty('/employee/address/form');
        const sActionText = oViewModel.getProperty('/employee/address/actionText');
        const mCheckFields = [
          { field: 'Subty', label: '주소유형', type: Validator.SELECT1 }, //
          { field: 'Begda', label: '적용시작일', type: Validator.INPUT1 },
          { field: 'State', label: '시/도', type: Validator.SELECT2 },
          { field: 'Pstlz', label: '우편번호', type: Validator.INPUT2 },
          { field: 'Zzaddr2', label: '상세주소', type: Validator.INPUT2 },
        ];

        if (!this.validator.check.call(this, { oInputData, mCheckFields })) return;

        const oSido = _.find(oViewModel.getProperty('/employee/address/sidoList'), { State: oInputData.State });
        delete oSido.Land1;
        delete oSido.__metadata;

        const { result } = await this.createAddressInfo({ oInputData: { ...oSido, ...oInputData } });

        if (result === 'success') {
          MessageBox.success(this.getText('MSG_00007', sActionText));

          this.refreshAddress({ oViewModel });
        } else {
          MessageBox.error(this.getText('MSG_00008', sActionText));
        }

        this.onAddressDialogClose();
      }

      async onPressModifyAddress(oEvent) {
        const oViewModel = this.getView().getModel();
        const oTable = oEvent.getSource().getParent().getParent().getParent().getItems()[1];
        const aSelectedIndices = oTable.getSelectedIndices();

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getText('MSG_00010', '수정'));
          return;
        } else if (aSelectedIndices.length > 1) {
          MessageBox.alert('수정할 데이터를 하나만 선택하세요.');
          return;
        }

        const oPayload = this.getAddressTableRowData({ oViewModel, oTable, aSelectedIndices });
        const oAddressDetail = await this.readAddressInfo({ oPayload });

        if (oAddressDetail.result === 'error') {
          MessageBox.error(this.getText('MSG_00008', '상세조회'));
          return;
        }

        oViewModel.setProperty('/employee/address/actionText', '수정');
        oViewModel.setProperty('/employee/address/form', oAddressDetail.result);

        this.openAddressDialog(oEvent);
        oTable.clearSelection();
      }

      onPressDeleteAddress(oEvent) {
        const oViewModel = this.getView().getModel();
        const oTable = oEvent.getSource().getParent().getParent().getParent().getItems()[1];
        const aSelectedIndices = oTable.getSelectedIndices();

        if (aSelectedIndices.length < 1) {
          MessageBox.alert(this.getText('MSG_00010', '삭제'));
          return;
        } else if (aSelectedIndices.length > 1) {
          MessageBox.alert('삭제할 데이터를 하나만 선택하세요.');
          return;
        }

        appUtils.setAppBusy(true, this);

        MessageBox.confirm(this.getText('MSG_00006', '삭제'), {
          actions: ['삭제', MessageBox.Action.CANCEL],
          onClose: async (sAction) => {
            if (sAction !== MessageBox.Action.CANCEL) {
              const oPayload = this.getAddressTableRowData({ oViewModel, oTable, aSelectedIndices });
              const { result } = await this.deleteAddressInfo({ oPayload });

              if (result === 'success') {
                oTable.clearSelection();
                this.refreshAddress({ oViewModel });

                MessageBox.success(this.getText('MSG_00007', '삭제'));
              } else {
                MessageBox.error(this.getText('MSG_00008', '삭제'));
              }
            }

            appUtils.setAppBusy(false, this);
          },
        });
      }

      openSearchZipCodePopup() {
        window.open('postcodeForBrowser.html?CBF=fn_SetAddr', 'pop', 'width=550,height=550, scrollbars=yes, resizable=yes');
      }

      onAddressDialogClose() {
        appUtils.setAppBusy(false, this);
        this.byId('addressDialog').close();
      }

      /*****************************************************************
       * Call oData
       *****************************************************************/
      readEmpSearchResult({ oSearchParam }) {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.COMMON);
          const sUrl = '/EmpSearchResultSet';

          oModel.read(sUrl, {
            filters: [
              new Filter('Persa', FilterOperator.EQ, oSearchParam.Werks), //
              new Filter('Zflag', FilterOperator.EQ, 'X'),
              new Filter('Actda', FilterOperator.EQ, moment().hour(9).toDate()),
              new Filter('Ename', FilterOperator.EQ, oSearchParam.searchText),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(oError);
            },
          });
        });
      }

      readAuthOrgTree() {
        return new Promise((resolve, reject) => {
          const oModel = this.getModel(ServiceNames.PA);
          const sUrl = '/AuthOrgTreeSet';

          oModel.read(sUrl, {
            filters: [
              new Filter('Datum', FilterOperator.EQ, moment().hour(9).toDate()), //
              new Filter('Xpern', FilterOperator.EQ, 'X'),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(oError);
            },
          });
        });
      }

      readEmpProfileMenu({ oModel, aFilters }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/EmpProfileMenuSet';

          oModel.read(sUrl, {
            filters: aFilters,
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(oError);
            },
          });
        });
      }

      readEmpProfileHeaderNew({ oModel, aFilters }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/EmpProfileHeaderNewSet';

          oModel.read(sUrl, {
            filters: aFilters,
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results[0]);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(oError);
            },
          });
        });
      }

      readEmpProfileHeaderTab({ oModel, aFilters }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/EmpProfileHeaderTabSet';

          oModel.read(sUrl, {
            filters: aFilters,
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(oError);
            },
          });
        });
      }

      readEmpProfileContentsTab({ oModel, aFilters }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/EmpProfileContentsTabSet';

          oModel.read(sUrl, {
            filters: aFilters,
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(oError);
            },
          });
        });
      }

      readTypeList({ oModel }) {
        return new Promise((resolve, reject) => {
          const oViewModel = this.getViewModel();
          const mTypeList = oViewModel.getProperty('/employee/address/typeList');
          const sUrl = '/PaCodeListSet';

          if (mTypeList.length > 1) {
            resolve(mTypeList);
          }

          oModel.read(sUrl, {
            filters: [
              new Filter('Cdnum', FilterOperator.EQ, 'CM0002'), //
              new Filter('Grcod', FilterOperator.EQ, '0006'),
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve([...mTypeList, ...oData.results]);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(oError);
            },
          });
        });
      }

      readCityList({ oModel, sPernr }) {
        return new Promise((resolve, reject) => {
          const oViewModel = this.getViewModel();
          const mSidoList = oViewModel.getProperty('/employee/address/sidoList');
          const sUrl = '/CityListSet';
          let aFilters = [];

          if (mSidoList.length > 1) {
            resolve(mSidoList);
            return;
          }

          if (sPernr) {
            aFilters.push(new Filter('Pernr', FilterOperator.EQ, sPernr));
          }

          oModel.read(sUrl, {
            filters: aFilters,
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve([...mSidoList, ...oData.results]);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(oError);
            },
          });
        });
      }

      readAddressInfo({ oPayload }) {
        return new Promise((resolve) => {
          const oModel = this.getModel(ServiceNames.PA);
          const sUrl = '/AddressInfoSet';

          oPayload.Begda = moment(oPayload.Begda).hour(9).toDate();

          oModel.read(sUrl, {
            filters: Object.keys(oPayload).map((field) => {
              return new Filter(field, FilterOperator.EQ, oPayload[field]);
            }),
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);
              resolve({ result: oData.results[0] });
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);
              resolve({ result: 'error' });
            },
          });
        });
      }

      createAddressInfo({ oInputData }) {
        return new Promise((resolve) => {
          const oModel = this.getModel(ServiceNames.PA);
          const sUrl = '/AddressInfoSet';

          oInputData.Begda = moment(oInputData.Begda).hour(9).toDate();

          oModel.create(sUrl, oInputData, {
            success: () => {
              resolve({ result: 'success' });
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);
              resolve({ result: 'error' });
            },
          });
        });
      }

      deleteAddressInfo({ oPayload }) {
        return new Promise((resolve) => {
          const oModel = this.getModel(ServiceNames.PA);

          oPayload.Begda = moment(oPayload.Begda).hour(9).toDate();

          const sUrl = oModel.createKey('/AddressInfoSet', oPayload);

          oModel.remove(sUrl, {
            success: () => {
              resolve({ result: 'success' });
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);
              resolve({ result: 'error' });
            },
          });
        });
      }
    }

    return Employee;
  }
);

// eslint-disable-next-line no-unused-vars
function fn_SetAddr(Zip, fullAddr) {
  const oView = sap.ui.getCore().byId('container-ehr---employee');
  const oViewModel = oView.getModel();

  oViewModel.setProperty('/employee/address/form/Pstlz', Zip);
  oViewModel.setProperty('/employee/address/form/Zzaddr1', fullAddr);
}
