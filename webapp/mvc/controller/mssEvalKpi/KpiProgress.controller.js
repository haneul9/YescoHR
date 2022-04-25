sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    Fragment,
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.mssEvalKpi.KpiProgress', {
      TableId: 'progressTable',
      ProgressDialogId: 'progressDialog',
      CommentDialogId: 'commentDialog',
      GroupDialogHandler: null,

      initializeModel() {
        return {
          busy: false,
          List: [],
          TeamList: [],
          TeamRowCount: 1,
          totalComment: '',
          search: {},
          title: {},
          selectedRow: {},
          monthComment: {},
          detail: [],
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
        };
      },

      // 진척율 입력
      progressInput(oEvent) {
        const oViewModel = this.getViewModel();
        let sValue = oEvent
          .getParameter('value')
          .trim()
          .replace(/[^\d'.']/g, '');

        if (_.includes(sValue, '.')) {
          const sReVal = sValue.replace(/['.']{2}/g, '.');
          const iIndex = sReVal.indexOf('.');

          sValue = sReVal.split('.')[0].slice(0, 3) + sReVal.slice(iIndex, iIndex + 2);
        } else {
          sValue = sValue.slice(0, 3);
        }

        const oEventSource = oEvent.getSource();
        const sPath = oEventSource.getParent().getBindingContext().getPath();
        const sScore = sValue || '0';

        oViewModel.setProperty(`${sPath}/Prgrt`, sScore);
        oEventSource.setValue(sScore);
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());

        try {
          oViewModel.setProperty('/busy', true);

          // 인사영역Code
          const oModel = this.getModel(ServiceNames.COMMON);
          const aComList = await Client.getEntitySet(oModel, 'PersAreaList');

          oViewModel.setProperty('/CompanyCode', aComList);
          oViewModel.setProperty(
            '/Years',
            _.times(2, (i) => ({ Zcode: moment().subtract(i, 'years').format('YYYY'), Ztext: `${moment().subtract(i, 'years').format('YYYY')}년` }))
          );
          oViewModel.setProperty('/search', {
            Werks: this.getAppointeeProperty('Werks'),
            Syear: moment().format('YYYY'),
          });

          this.getProgressList();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async onSearch() {
        const oViewModel = this.getViewModel();

        try {
          this.getProgressList();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Dialog Close
      onCloseClick(oEvent) {
        oEvent.getSource().getParent().close();
      },

      // kpi/중첨추진과제 List
      async getProgressList() {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const mSearch = oViewModel.getProperty('/search');
        const aList = await Client.getEntitySet(oModel, 'KpiProztList', _.pick(mSearch, ['Werks', 'Syear']));
        const oTable = this.byId(this.TableId);

        oViewModel.setProperty('/List', aList);
        oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aList }));
      },

      // KPI/과제 명 Link Popover
      async onPressLink(oEvent) {
        if (!this.dCommentDialog) {
          const oView = this.getView();

          this.dCommentDialog = Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.mssEvalKpi.fragment.progress.MonthComment',
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }

        const oViewModel = this.getViewModel();
        const vPath = oEvent.getSource().getParent().getBindingContext().getPath();
        const mRowData = _.cloneDeep(oViewModel.getProperty(vPath));

        oViewModel.setProperty('/monthComment', {
          Month: mRowData.Smnth,
          Date: `${oViewModel.getProperty('/search/Syear')}.${mRowData.Smnth}`,
          Cmmnt: mRowData.Cmmnt,
        });

        this.dCommentDialog.then(function (oDialog) {
          oDialog.open();
        });
      },

      // kpiFileUrl
      async getUrl(mSelectedRow = {}) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.APPRAISAL);

          return await Client.getEntitySet(oModel, 'KpiCascadingFileUrl', _.pick(mSelectedRow, ['Zfilekey', 'Zfiledoc']));
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 진척율 Click
      async onPressProgress(oEvent) {
        try {
          if (!this.dProgressDialog) {
            const oView = this.getView();

            this.dProgressDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.mssEvalKpi.fragment.progress.ProgressDialog',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          const oViewModel = this.getViewModel();
          const sPath = oEvent.getSource().getBindingContext().getPath();
          const mSelectedRow = _.cloneDeep(oViewModel.getProperty(sPath));

          this.getProgressDetail(mSelectedRow);

          oViewModel.setProperty('/title', {
            year: oViewModel.getProperty('/search/Syear'),
            name: mSelectedRow.Objtx9091,
            part: mSelectedRow.Orgtx,
          });

          this.dProgressDialog.then(function (oDialog) {
            oDialog.open();
          });
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      // 진척도 상세조회
      async getProgressDetail(mSelectedRow = {}) {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const mPayLoad = {
          ..._.pick(mSelectedRow, ['ObjidO', 'Objid9091']),
          Werks: this.getAppointeeProperty('Werks'),
          Syear: oViewModel.getProperty('/search/Syear'),
        };

        oViewModel.setProperty('/selectedRow', mPayLoad);

        const aList = await Client.getEntitySet(oModel, 'KpiProztDetail', mPayLoad);

        oViewModel.setProperty('/detail', [
          // 월, 진척율(%)
          { month: this.getBundleText('LABEL_18025'), progress: this.getBundleText('LABEL_15013'), hide: true },
          ..._.forEach(aList, (e) => {
            e.hide = false;
          }),
        ]);
      },

      // 수행 팀 수 Link Press
      async onPressTeam(oEvent) {
        try {
          const oViewModel = this.getViewModel();
          const sPath = oEvent.getSource().getBindingContext().getPath();
          const aList = await this.getTeamList(oViewModel.getProperty(sPath));
          const iLength = aList.length;

          if (!iLength) {
            return;
          }

          oViewModel.setProperty('/TeamList', aList);
          oViewModel.setProperty('/TeamRowCount', iLength);

          if (!this.dTeamListDialog) {
            const oView = this.getView();

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

      // 수행 팀 목록 조회
      getTeamList(mSelectedRow = {}) {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const mPayLoad = {
          Objid: mSelectedRow.Objid9091,
          Otype: mSelectedRow.Otype,
          Zyear: oViewModel.getProperty('/search/Syear'),
        };

        oViewModel.setProperty('/TeamList', []);

        return Client.getEntitySet(oModel, 'KpiCascadingTeamList', mPayLoad);
      },

      // List의 CommentBtn 클릭
      async onCommentDialog(oEvent) {
        try {
          const oViewModel = this.getViewModel();
          const sPath = oEvent.getSource().getBindingContext().getPath();
          const aList = await this.getTotalComment(oViewModel.getProperty(sPath));

          if (!this.dAllCommentDialog) {
            const oView = this.getView();

            this.dAllCommentDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.mssEvalKpi.fragment.progress.TotalComment',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          const oCommentBox = this.byId('totalComm');

          if (!!oCommentBox.getItems()[0]) {
            oCommentBox.removeItem(0);
          }

          let sTotal = '';

          _.forEach(aList, (e) => {
            const sBr = !sTotal ? '' : '<br/>';

            if (!!e.Cmmnt) {
              sTotal = `${sTotal}${sBr}<span style='text-decoration: underline; font-size:14px;'>${e.Chapnm}</span><br/><span style='font-weight:500; font-size:14px'>${e.Cmmnt}<br/></span>`;
            }
          });

          oCommentBox.addItem(
            new sap.ui.core.HTML({
              content: sTotal,
              layoutData: new sap.m.FlexItemData({ growFactor: 1 }),
            })
          );

          this.dAllCommentDialog.then(function (oDialog) {
            oDialog.open();
          });
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      // total 담당자 Comment
      getTotalComment(mSelectedRow = {}) {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const mPayLoad = {
          ..._.pick(mSelectedRow, ['ObjidO', 'Objid9091']),
          Werks: this.getAppointeeProperty('Werks'),
          Syear: oViewModel.getProperty('/search/Syear'),
        };

        return Client.getEntitySet(oModel, 'KpiProztDetail', mPayLoad);
      },

      // 담당자 Comment 저장
      onCommentSaveBtn() {
        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          // 저장, 취소
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 저장
            if (!vPress || vPress !== this.getBundleText('LABEL_00103')) {
              return;
            }

            const oDialog = this.byId(this.CommentDialogId);

            try {
              oDialog.setBusy(true);

              const oViewModel = this.getViewModel();
              const aDetailList = oViewModel.getProperty('/detail');
              const oModel = this.getModel(ServiceNames.APPRAISAL);
              const mComment = oViewModel.getProperty('/monthComment');
              const mRowData = oViewModel.getProperty('/selectedRow');
              const mSendObject = {
                ..._.pick(mRowData, ['Werks', 'Syear', 'Objid9091', 'ObjidO']),
                KpiProztNav: _.chain(aDetailList)
                  .reject((e) => {
                    return !e.Smnth;
                  })
                  .forEach((e) => {
                    if (mComment.Month === e.Smnth) {
                      e.Cmmnt = mComment.Cmmnt;
                    }
                  })
                  .value(),
              };

              await Client.deep(oModel, 'KpiProztDetail', mSendObject);

              // {저장}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'), {
                onClose: () => {
                  this.getProgressList();
                  this.getProgressDetail(mRowData);
                  oDialog.close();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              oDialog.setBusy(false);
            }
          },
        });
      },

      // 진척율 상세내용 저장
      onSaveBtn() {
        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          // 저장, 취소
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 저장
            if (!vPress || vPress !== this.getBundleText('LABEL_00103')) {
              return;
            }

            const oDialog = this.byId(this.ProgressDialogId);

            try {
              oDialog.setBusy(true);

              const oViewModel = this.getViewModel();
              const oModel = this.getModel(ServiceNames.APPRAISAL);
              const mSendObject = {
                ..._.pick(oViewModel.getProperty('/selectedRow'), ['Werks', 'Syear', 'Objid9091', 'ObjidO']),
                KpiProztNav: _.reject(oViewModel.getProperty('/detail'), (e) => {
                  return !e.Smnth;
                }),
              };

              await Client.deep(oModel, 'KpiProztDetail', mSendObject);

              // {저장}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'), {
                onClose: () => {
                  this.getProgressList();
                  oDialog.close();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              oDialog.setBusy(false);
            }
          },
        });
      },
    });
  }
);
