sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/GroupDialogHandler',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/exceptions/ODataCreateError',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    Filter,
    FilterOperator,
    Fragment,
    MessageBox,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    GroupDialogHandler,
    ODataReadError,
    ODataCreateError,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.mssEvalKpi.Kpi', {
      GroupDialogHandler: null,

      initializeModel() {
        return {
          busy: false,
          BtnStat: true,
          authority: true,
          List: [],
          Years: [],
          TeamList: [],
          PartCode: [],
          CompanyCode: [],
          Tmp: [{ TmpGrid: {} }],
          tab: {
            selectedKey: 'A',
          },
          search: {
            Werks: '',
            Orgeh: '',
            Orgtx: '',
            Zyear: '',
          },
          situation: {
            segmentKey: 'A',
          },
          CascadingSitu: {
            SituList: [],
          },
          listRowCount: 1,
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());

        try {
          const oSessionData = this.getSessionData();
          const aComList = await this.areaList();

          oViewModel.setProperty('/CompanyCode', aComList);
          this.setYears();

          const aPartList = await this.partList();

          // 권한이 없을경우는 현황tab만
          if (_.isEmpty(aPartList)) {
            oViewModel.setProperty('/authority', false);
            oViewModel.setProperty('/tab/selectedKey', 'C');
            oViewModel.setProperty('/situation/segmentKey', 'A');

            this.GroupDialogHandler = new GroupDialogHandler(this, ([mOrgData]) => {
              oViewModel.setProperty('/search/Orgeh', _.isEmpty(mOrgData) ? null : mOrgData.Orgeh);
              oViewModel.setProperty('/search/Orgtx', _.isEmpty(mOrgData) ? '' : mOrgData.Stext);
            });

            oViewModel.setProperty('/CascadingSitu', {
              Label1: this.getBundleText('LABEL_00224'),
              Label2: '',
            });

            oViewModel.setProperty('/search', {
              Werks: this.getSessionProperty('Werks'),
              Zyear: String(new Date().getFullYear()),
              Orgeh: this.getAppointeeProperty('Orgeh'),
              Orgtx: this.getAppointeeProperty('Orgtx'),
            });

            const aTreeList = await this.setTreeList();
            const aVariat = this.oDataChangeTree(aTreeList);

            oViewModel.setProperty('/CascadingSitu/SituList', aVariat);
          } else {
            oViewModel.setProperty('/PartCode', aPartList);
            oViewModel.setProperty('/search', {
              Werks: oSessionData.Werks,
              Orgeh: _.get(aPartList, [0, 'Orgeh']),
              Orgtx: _.get(aPartList, [0, 'Orgtx']),
              Zyear: String(new Date().getFullYear()),
            });
            this.onSearch();
          }
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      formatText(sText = '') {
        return sText ? ` ${this.getBundleText('MSG_15004')} ` : '';
      },

      onClick() {
        this.getRouter().navTo('clubJoin-detail', { oDataKey: 'N' });
      },

      // 인사영역Code
      areaList() {
        const oModel = this.getModel(ServiceNames.COMMON);

        return new Promise((resolve, reject) => {
          oModel.read('/PersAreaListSet', {
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(oData.results);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // 부문Code
      partList(sWerks = this.getSessionProperty('Werks')) {
        const oModel = this.getModel(ServiceNames.APPRAISAL);

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingOrgehSet', {
            filters: [new Filter('Werks', FilterOperator.EQ, sWerks)],
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(oData.results);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // Cascading 현황 Kpi별 수행조직현황의 회사선택시
      async onWerksPress() {
        const oViewModel = this.getViewModel();
        const aKpiList = await this.getKPIList();

        oViewModel.setProperty('/CascadingSitu', {
          Label1: this.getBundleText('LABEL_00220'),
          Label2: this.getBundleText('LABEL_15014'),
          SecondCode: aKpiList,
        });

        oViewModel.setProperty('/search/Objid', 'ALL');
        oViewModel.setProperty('/search/Orgeh', '');
        oViewModel.setProperty('/search/Otype', '');

        const aTreeList = await this.setTreeList();
        const aVariat = this.oDataChangeTree(aTreeList);

        oViewModel.setProperty('/CascadingSitu/SituList', aVariat);
      },

      // 평가년도 setting
      setYears(iYear = new Date().getFullYear()) {
        const oViewModel = this.getViewModel();
        const aYearsList = [];

        aYearsList.push({ Zcode: String(iYear), Ztext: `${iYear}년` }, { Zcode: String(iYear - 1), Ztext: `${iYear - 1}년` });

        oViewModel.setProperty('/Years', aYearsList);
      },

      // 저장 BtnVisible
      hideSaveBtn(sWerks = this.getSessionProperty('Werks')) {
        const oModel = this.getModel(ServiceNames.APPRAISAL);

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingActiveSet', {
            filters: [
              //
              new Filter('Werks', FilterOperator.EQ, sWerks),
              new Filter('Zyear', FilterOperator.EQ, this.getViewModel().getProperty('/search/Zyear')),
            ],
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(oData.results[0].Active === 'X');
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // 평가년도 클릭
      onYearsBtn() {
        this.onSearch();
      },

      // TabBar 선택
      async onSelectTabBar() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          if (oViewModel.getProperty('/tab/selectedKey') !== 'C') {
            const aPartList = await this.partList();

            oViewModel.setProperty('/PartCode', aPartList);
            oViewModel.setProperty('/search', {
              Werks: this.getSessionProperty('Werks'),
              Orgeh: oViewModel.getProperty('/PartCode/0/Orgeh'),
              Orgtx: oViewModel.getProperty('/PartCode/0/Orgtx'),
              Zyear: String(new Date().getFullYear()),
            });
            const aTableList = await this.getAllCascading();
            const iTableLength = aTableList.length;

            oViewModel.setProperty('/List', aTableList);
            oViewModel.setProperty('/listRowCount', iTableLength > 7 ? 7 : iTableLength);

            const aGridList = await this.getPartCascading();

            if (oViewModel.getProperty('/tab/selectedKey') === 'B') {
              this.setTeamGridList(aGridList);
            } else {
              aGridList.unshift({ Stext: this.getBundleText('MSG_15002'), Orgeh: oViewModel.getProperty('/search/Orgeh') });
            }

            oViewModel.setProperty('/PartList', aGridList);
          } else {
            oViewModel.setProperty('/situation/segmentKey', 'A');

            this.GroupDialogHandler = new GroupDialogHandler(this, ([mOrgData]) => {
              oViewModel.setProperty('/search/Orgeh', _.isEmpty(mOrgData) ? null : mOrgData.Orgeh);
              oViewModel.setProperty('/search/Orgtx', _.isEmpty(mOrgData) ? '' : mOrgData.Stext);
            });

            oViewModel.setProperty('/CascadingSitu', {
              Label1: this.getBundleText('LABEL_00224'),
              Label2: '',
            });

            oViewModel.setProperty('/search', {
              Werks: this.getSessionProperty('Werks'),
              Zyear: String(new Date().getFullYear()),
              Orgeh: this.getAppointeeProperty('Orgeh'),
              Orgtx: this.getAppointeeProperty('Orgtx'),
            });

            const aTreeList = await this.setTreeList();
            const aVariat = this.oDataChangeTree(aTreeList);

            oViewModel.setProperty('/CascadingSitu/SituList', aVariat);
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Cascading KPI 종류
      getKPIList() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const mSearch = oViewModel.getProperty('/search');

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingKpiListSet', {
            filters: [
              // prettier 방지주석
              new Filter('Werks', FilterOperator.EQ, oViewModel.getProperty('/search/Werks')),
              new Filter('Zyear', FilterOperator.EQ, mSearch.Zyear),
            ],
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(new ComboEntry({ codeKey: 'Objid', valueKey: 'Stext', aEntries: oData.results }));
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      async onPressLink(oEvent) {
        const oViewModel = this.getViewModel();
        const vPath = oEvent.getSource().getParent().getBindingContext().getPath();
        const oRowData = oViewModel.getProperty(vPath);
        const [oUrl] = await this.getUrl(oRowData);

        window.open(oUrl.Url, '_blank');
      },

      // GridContainer의 정의서 url
      async onUrlPress(oEvent) {
        const oViewModel = this.getViewModel();
        const vPath = oEvent.getSource().getBindingContext().getPath();
        const oRowData = oViewModel.getProperty(vPath);
        const [oUrl] = await this.getUrl(oRowData);

        window.open(oUrl.Url, '_blank');
      },

      // kpiFileUrl
      async getUrl(mSelectedRow = {}) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const mPayLoad = {
            Zfilekey: mSelectedRow.Zfilekey,
            Zfiledoc: mSelectedRow.Zfiledoc,
          };

          return await Client.getEntitySet(oModel, 'KpiCascadingFileUrl', mPayLoad);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Cascading 현황 SegmaneBtn
      async onSegmentBtn() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/search', {
          Werks: this.getSessionProperty('Werks'),
          Zyear: String(new Date().getFullYear()),
          Objid: 'ALL',
          Orgeh: this.getAppointeeProperty('Orgeh'),
          Orgtx: this.getAppointeeProperty('Orgtx'),
          Otype: '',
        });

        if (oViewModel.getProperty('/situation/segmentKey') === 'A') {
          oViewModel.setProperty('/CascadingSitu', {
            Label1: this.getBundleText('LABEL_00224'),
            Label2: '',
          });
        } else {
          const aKpiList = await this.getKPIList();

          oViewModel.setProperty('/CascadingSitu', {
            Label1: this.getBundleText('LABEL_00220'),
            Label2: this.getBundleText('LABEL_15014'),
            SecondCode: aKpiList,
          });
        }

        const aTreeList = await this.setTreeList();
        const aVariat = this.oDataChangeTree(aTreeList);

        oViewModel.setProperty('/CascadingSitu/SituList', aVariat);
      },

      // Cascading 현황에 조직 별 treetable
      setTreeList() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const mSearch = oViewModel.getProperty('/search');
        const bKey = oViewModel.getProperty('/situation/segmentKey') === 'A';

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingTreeSet', {
            filters: [
              new Filter('Werks', FilterOperator.EQ, mSearch.Werks), //
              new Filter('Zyear', FilterOperator.EQ, mSearch.Zyear),
              new Filter('Seroty', FilterOperator.EQ, bKey ? 'O' : mSearch.Otype),
              new Filter('Serobj', FilterOperator.EQ, bKey ? mSearch.Orgeh : mSearch.Objid === 'ALL' ? '' : mSearch.Objid),
            ],
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(oData.results);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // Cascading 조회
      async onCasSituList() {
        const oViewModel = this.getViewModel();
        const aTreeList = await this.setTreeList();
        const aVariat = this.oDataChangeTree(aTreeList);

        oViewModel.setProperty('/CascadingSitu/SituList', aVariat);
      },

      // oData Tree구조로 만듦
      oDataChangeTree(aList = []) {
        const aConvertedList = _.chain(aList)
          .cloneDeep()
          .map((o) => _.omit(o, '__metadata'))
          .value();
        const mGroupedByParents = _.groupBy(aConvertedList, 'ObjidUp');
        const mCatsById = _.keyBy(aConvertedList, 'Objid');
        const oTree = this.byId('SituTree');

        oTree.collapseAll();
        oTree.expandToLevel(1);
        _.each(_.omit(mGroupedByParents, '00000000'), (children, parentId) => _.set(mCatsById, [parentId, 'children'], children));

        return mGroupedByParents['00000000'];
      },

      onCasSituSecSelect(oEvent) {
        const oViewModel = this.getViewModel();
        const sKey = oEvent.getSource().getSelectedKey();

        oViewModel.getProperty('/CascadingSitu/SecondCode').forEach((e) => {
          if (sKey === e.Objid) {
            oViewModel.setProperty('/search/Otype', e.Otype || '');
          }
        });
      },

      // 부문에 해당되는 팀 Cadcading
      detailTeamList() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const mSearch = oViewModel.getProperty('/search');

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingTeamListSet', {
            filters: [new Filter('Zyear', FilterOperator.EQ, mSearch.Zyear), new Filter('Otype', FilterOperator.EQ, mSearch.Otype), new Filter('Objid', FilterOperator.EQ, mSearch.Objid)],
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(oData.results);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // 회사선택
      async onCompSelect(oEvent) {
        const oViewModel = this.getViewModel();
        const aPartList = await this.partList(oEvent.getSource().getSelectedKey());

        oViewModel.setProperty('/PartCode', aPartList);
        oViewModel.setProperty('/search/Orgeh', !!aPartList.length ? aPartList[0].Orgeh : '');
        oViewModel.setProperty('/search/Orgtx', !!aPartList.length ? aPartList[0].Orgtx : '');

        const sBtnStat = await this.hideSaveBtn(oViewModel.getProperty('/search/Werks'));

        oViewModel.setProperty('/BtnStat', sBtnStat);
      },

      async onSearch() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);
        try {
          const sBtnStat = await this.hideSaveBtn(oViewModel.getProperty('/search/Werks'));

          oViewModel.setProperty('/BtnStat', sBtnStat);

          const aTableList = await this.getAllCascading();
          const iTableLength = aTableList.length;

          oViewModel.setProperty('/List', aTableList);
          oViewModel.setProperty('/listRowCount', iTableLength > 7 ? 7 : iTableLength);

          const aPartList = await this.getPartCascading();

          if (oViewModel.getProperty('/tab/selectedKey') === 'B') {
            this.setTeamGridList(aPartList);
          } else {
            aPartList.unshift({ Stext: this.getBundleText('MSG_15002'), Orgeh: oViewModel.getProperty('/search/Orgeh') });
          }

          oViewModel.setProperty('/PartList', aPartList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 부문 선택
      async onPartSelect(oEvent) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/search/Orgtx', oEvent.getSource().getValue());

        const sBtnStat = await this.hideSaveBtn(oViewModel.getProperty('/search/Werks'));

        oViewModel.setProperty('/BtnStat', sBtnStat);
      },

      // 수행 팀 수 Link Press
      async onPressTeam(oEvent) {
        try {
          const sPath = oEvent.getSource().getBindingContext().getPath();
          const oView = this.getView();
          const oViewModel = this.getViewModel();
          const aList = await this.getTeamList(oViewModel.getProperty(sPath));
          const iLength = aList.length;

          if (!iLength) {
            return;
          }

          oViewModel.setProperty('/TeamList', aList);
          oViewModel.setProperty('/TeamRowCount', iLength);

          if (!this.dTeamListDialog) {
            this.dTeamListDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.mssEvalKpi.fragment.tabDetail.dialog.TeamList',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          this.dTeamListDialog.then(function (oDialog) {
            oDialog.open();
          });
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      onCloseClick(oEvent) {
        oEvent.getSource().getParent().close();
      },

      // 수행 팀 목록 조회
      getTeamList(mSelectedRow = {}) {
        const oModel = this.getModel(ServiceNames.APPRAISAL);

        this.getViewModel().setProperty('/TeamList', []);

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingTeamListSet', {
            filters: [new Filter('Zyear', FilterOperator.EQ, mSelectedRow.Zyear), new Filter('Otype', FilterOperator.EQ, mSelectedRow.Otype), new Filter('Objid', FilterOperator.EQ, mSelectedRow.Objid)],
            success: (oData) => {
              if (oData) {
                this.debug(oData);
                resolve(oData.results);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // teamcascading 드롭
      onTeamDrop(oInfo) {
        const oViewModel = this.getViewModel();
        const oDragged = oInfo.getParameter('draggedControl');
        const oDropped = oInfo.getParameter('droppedControl');
        const oDraggPath = oDragged.getBindingContext().getPath();
        const oGrid = oDropped.getParent();
        const mDraggData = _.cloneDeep(oViewModel.getProperty(oDraggPath));
        const sDraggListPath = oDropped.getParent().getBindingContext().getPath();
        const sDropPath = `${sDraggListPath}/TmpGrid`;
        const aGridList = oViewModel.getProperty(sDropPath);
        const bDragIndex = oGrid.indexOfItem(oDragged) === -1;
        // let bInsertPosition = oInfo.getParameter('dropPosition') === 'Before';
        let iDropPosition = oGrid.indexOfItem(oDropped);

        // 빈 박스 드롭시 , 첫번째 drop시, 겹칠시
        if (
          (!mDraggData.Ztext && !mDraggData.Stext) ||
          (iDropPosition === 0 && !bDragIndex) ||
          !_.isEmpty(
            _.filter(aGridList, (e) => {
              return e.Objid === mDraggData.Objid;
            })
          )
        ) {
          return;
        }

        // 부문 중복체크
        if (
          oDropped.sParentAggregationName !== oDragged.sParentAggregationName &&
          aGridList.some((e) => {
            return e.Otype === mDraggData.Otype && e.Stext === mDraggData.Stext;
          })
        ) {
          MessageBox.alert(this.getBundleText('MSG_15001'));
          return;
        }

        // remove the item
        const iDragPosition = bDragIndex ? 0 : oGrid.indexOfItem(oDragged);

        if (!bDragIndex) {
          aGridList.splice(iDragPosition, 1);

          // if (iDragPosition < iDropPosition && aGridList.length === iDropPosition) {
          //   iDropPosition--;
          // }
        } else {
          if (iDropPosition === 0) {
            iDropPosition++;
          }

          if (oDragged.sParentAggregationName === 'items') {
            const sDragPath = oDragged.getParent().getBindingContext().getPath();
            const sDragDetailPath = `${sDragPath}/TmpGrid`;

            oViewModel.setProperty(
              sDragDetailPath,
              _.filter(oViewModel.getProperty(sDragDetailPath), (e) => {
                return mDraggData.Objid !== e.Objid;
              })
            );
          }
        }

        mDraggData.Orgeh = oViewModel.getProperty(`${sDraggListPath}/Orgeh`);
        mDraggData.Orgtx = oViewModel.getProperty(`${sDraggListPath}/Label`);
        mDraggData.Zteam = mDraggData.Tmcnt === '0' ? '' : 'X';

        // insert the control in target aggregation bInsertPosition ? 0 : -1
        aGridList.splice(iDropPosition, 0, mDraggData);

        oViewModel.setProperty(
          '/Tmp',
          _.each(oViewModel.getProperty('/Tmp'), (e) => {
            e.TmpGrid = _.filter(e.TmpGrid, (e1) => {
              return e.Orgeh === e1.Orgeh;
            });
          })
        );
        oViewModel.setProperty(sDropPath, aGridList);
        oViewModel.setProperty('/PartList', [mDraggData, ...oViewModel.getProperty('/PartList')]);
      },

      // 부문 drop
      onDrop(oInfo) {
        const oViewModel = this.getViewModel();
        const oDragged = oInfo.getParameter('draggedControl');
        const oDropped = oInfo.getParameter('droppedControl');
        const oDraggPath = oDragged.getBindingContext().getPath();
        const oGrid = oDropped.getParent();
        const mDraggData = oViewModel.getProperty(oDraggPath);
        const aGridList = oViewModel.getProperty('/PartList');
        const bDragIndex = oGrid.indexOfItem(oDragged) === -1;
        // let bInsertPosition = oInfo.getParameter('dropPosition') === 'Before';
        let iDropPosition = oGrid.indexOfItem(oDropped);

        // 빈 박스 드롭시 , 첫번째 Drop시
        if (!mDraggData.Objid || (iDropPosition === 0 && !bDragIndex)) {
          return;
        }

        // 부문 중복체크
        if (
          oDropped.sParentAggregationName !== oDragged.sParentAggregationName &&
          aGridList.some((e) => {
            return e.Otype === mDraggData.Otype && e.Stext === mDraggData.Stext;
          })
        ) {
          MessageBox.alert(this.getBundleText('MSG_15001'));
          return;
        }

        // remove the item
        const iDragPosition = bDragIndex ? 0 : oGrid.indexOfItem(oDragged);

        if (!bDragIndex) {
          aGridList.splice(iDragPosition, 1);

          // if (iDragPosition < iDropPosition && aGridList.length === iDropPosition) {
          //   iDropPosition--;
          // }
        } else {
          if (iDropPosition === 0) {
            iDropPosition++;
          }
        }

        mDraggData.Orgeh = oViewModel.getProperty('/search/Orgeh');
        mDraggData.Zteam = mDraggData.Tmcnt === '0' ? '' : 'X';

        // insert the control in target aggregation
        aGridList.splice(iDropPosition, 0, mDraggData);
        oViewModel.setProperty('/PartList', aGridList);
      },

      // table rowData Drag
      onDragStart(oEvent) {
        const oDraggedRow = oEvent.getParameter('target');
        const oDragSession = oEvent.getParameter('dragSession');

        // keep the dragged row context for the drop action
        oDragSession.setComplexData('draggedRowContext', oDraggedRow.getBindingContext());
      },

      // DropEvent
      onDropTable(oEvent) {
        const oViewModel = this.getViewModel();
        const oDragSession = oEvent.getParameter('dragSession');
        const oDraggedRowContext = oDragSession.getComplexData('draggedRowContext');
        const sDraggPath = oDraggedRowContext.getPath();
        const mDraggData = oViewModel.getProperty(sDraggPath);
        const bTabKey = oViewModel.getProperty('/tab/selectedKey') === 'A';

        if (!oDraggedRowContext || !mDraggData.Objid || oDragSession.getDragControl().getMetadata().getElementName().search('GridListItem') === -1) return;

        const aGridList = bTabKey ? oViewModel.getProperty('/PartList') : oViewModel.getProperty(sDraggPath.slice(0, sDraggPath.lastIndexOf('/')));
        const aPartList = aGridList.filter((x) => ![mDraggData].includes(x));

        // reset the rank property and update the model to refresh the bindings
        oViewModel.setProperty(bTabKey ? '/PartList' : sDraggPath.slice(0, sDraggPath.lastIndexOf('/')), aPartList);
        oViewModel.refresh(true);
      },

      // table cascading조회
      getAllCascading() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const oSearch = oViewModel.getProperty('/search');
        const mFilters = {
          Gubun: oViewModel.getProperty('/tab/selectedKey'),
          ..._.pick(oSearch, ['Werks', 'Orgeh', 'Zyear']),
        };

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingListSet', {
            filters: _.chain(mFilters)
              .omitBy(_.isNil)
              .map((v, p) => new Filter(p, FilterOperator.EQ, v))
              .value(),
            success: (oData) => {
              resolve(oData.results);
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // grid cascading조회
      getPartCascading(sOrgeh = '') {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const oSearch = oViewModel.getProperty('/search');
        const sKey = oViewModel.getProperty('/tab/selectedKey');
        const mFilters = {
          Gubun: sKey,
          Orgeh: sOrgeh || oSearch.Orgeh,
          ..._.pick(oSearch, ['Werks', 'Zyear']),
        };

        return new Promise((resolve, reject) => {
          oModel.read('/KpiCascadingOrgListSet', {
            filters: _.chain(mFilters)
              .omitBy(_.isNil)
              .map((v, p) => new Filter(p, FilterOperator.EQ, v))
              .value(),
            success: (oData) => {
              if (oData) {
                const aGridList = oData.results;
                let aNotEmpty = [];

                if (sKey === 'A') {
                  aNotEmpty = aGridList.filter((e) => {
                    return !!e.Stext || !!e.Ztext;
                  });
                } else {
                  aGridList.forEach((e) => {
                    if (!e.Stext && !e.Ztext) {
                      aNotEmpty.push({
                        Label: e.Orgtx,
                        Orgtx: e.Orgtx,
                        Orgeh: e.Orgeh,
                        TmpGrid: [],
                      });
                    } else {
                      aNotEmpty.push(e);
                    }
                  });
                }

                resolve(aNotEmpty);
              }
            },
            error: (oError) => {
              this.debug(oError);
              reject(new ODataReadError(oError));
            },
          });
        });
      },

      // 부서선택
      onPressSearchOrgeh() {
        this.GroupDialogHandler.openDialog();
      },

      // 팀 cascading grid settings
      setTeamGridList(aList = []) {
        const oViewModel = this.getViewModel();
        const sTempMessage = this.getBundleText('MSG_15002');
        let aFilterList = [];

        if (!aList.length) {
          aFilterList = [];
        } else {
          aFilterList = _.chain(aList)
            .groupBy('Orgtx')
            .map((v, p) => ({ Label: p, Orgeh: v[0].Orgeh, TmpGrid: !!v[0].Ztext || !!v[0].Stext ? v : [] }))
            .forEach((o) => o.TmpGrid.unshift({ Stext: sTempMessage, Orgeh: o.Orgeh }))
            .value();
        }

        oViewModel.setProperty('/Tmp', aFilterList);
      },

      // 저장
      onSaveBtn() {
        const oViewModel = this.getViewModel();
        const sTabKey = oViewModel.getProperty('/tab/selectedKey');

        if (sTabKey === 'B' && _.isEmpty(oViewModel.getProperty('/Tmp'))) {
          return MessageBox.alert(this.getBundleText('MSG_15006')); // Cascading할 부서가 존재하지 않습니다.
        }

        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          // {저장}하시겠습니까?
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')], // 저장, 취소
          onClose: async (vPress) => {
            if (!vPress || vPress !== this.getBundleText('LABEL_00103')) {
              // 저장
              return;
            }

            try {
              AppUtils.setAppBusy(true);

              const aList = [];
              let aGridData = [];

              if (sTabKey === 'A') {
                aGridData = oViewModel.getProperty('/PartList');

                aGridData.forEach((e) => {
                  if (!!e.Otype) {
                    aList.push(e);
                  }
                });

                if (_.isEmpty(aList)) {
                  aList.push({ Orgeh: aGridData[0].Orgeh });
                }
              } else {
                aGridData = oViewModel.getProperty('/Tmp');

                aGridData.forEach((e) => {
                  const TmpList = e.TmpGrid;

                  aList.push(...TmpList);
                });
              }

              let oSendObject = {
                Gubun: sTabKey,
                Zyear: oViewModel.getProperty('/search/Zyear'),
                KpiCascadingNav: aList,
              };

              const oModel = this.getModel(ServiceNames.APPRAISAL);

              await new Promise((resolve, reject) => {
                oModel.create('/KpiCascadingOrgListSet', oSendObject, {
                  success: () => {
                    resolve();
                  },
                  error: (oError) => {
                    reject(new ODataCreateError({ oError }));
                  },
                });
              });

              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103')); // {저장}되었습니다.
              this.onSearch();
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },
    });
  }
);
