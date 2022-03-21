sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    Fragment,
    MessageBox,
    Appno,
    AttachFileAction,
    ComboEntry,
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.referenceRoom.ReferenceRoom', {
      AttachFileAction: AttachFileAction,
      initializeModel() {
        return {
          busy: false,
          Hass: this.isHass(),
          FormData: {},
          MenuIdList: [],
          ManagerList: [],
          TreeFullList: [],
          ReferenceList: [],
          AccType: [],
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());

        try {
          const aTree = await this.getReferenceRoom();
          const aVariat = this.oDataChangeTree(aTree.HelpInfo1Nav.results);

          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.COMMON, 'HelpInfoTab2')));
          oViewModel.setProperty('/TreeFullList', aTree.HelpInfo1Nav.results);
          oViewModel.setProperty('/ReferenceList', aVariat);
          this.settingsAttachTable();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 메뉴 경로

      // tree정보 다받아옴
      async getReferenceRoom() {
        const oModel = this.getModel(ServiceNames.COMMON);
        const mAppointee = this.getAppointeeData();
        const mPayLoad = {
          Pernr: mAppointee.Pernr,
          Werks: mAppointee.Werks,
          Menid: this.getCurrentMenuId(),
          Prcty: 'T',
          HelpInfo1Nav: [],
          HelpInfo2Nav: [],
          HelpInfo3Nav: [],
          HelpInfo4Nav: [],
        };

        return await Client.deep(oModel, 'HelpInfo', mPayLoad);
      },

      // PDF출력파일 첨부
      onFileChange(oEvent) {
        const [sFile] = oEvent.getParameter('files');

        this.getViewModel().setProperty('/FormData/PDFFile', sFile);
      },

      // TreeSelect
      async onSelectTree(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getSource().getSelectedContexts()[0].getPath();
        const mSelectedTree = oViewModel.getProperty(sPath);

        oViewModel.setProperty('/FormData', mSelectedTree);
        const oDetail = await this.treeDetail(mSelectedTree.L1id, mSelectedTree.L2id, mSelectedTree.L3id, mSelectedTree.L4id, mSelectedTree.Werks);
        const aMenuId = await this.helpMenuId(mSelectedTree.Werks);

        oViewModel.setProperty('/MenuIdList', new ComboEntry({ codeKey: 'Menid', valueKey: 'Mentx', aEntries: aMenuId }));
        oViewModel.setProperty('/FormData/Menid1', 'ALL');
        oViewModel.setProperty('/FormData/Menid2', 'ALL');
        oViewModel.setProperty('/FormData/Menid3', 'ALL');

        const sRoutL2 = mSelectedTree.L2tx ? ` > ${mSelectedTree.L2tx}` : '';
        const sRoutL3 = mSelectedTree.L3tx ? ` > ${mSelectedTree.L3tx}` : '';
        const sRoutL4 = mSelectedTree.L4tx ? ` > ${mSelectedTree.L4tx}` : '';

        oViewModel.setProperty('/FormData/MenuRoute', `${mSelectedTree.L1tx}${sRoutL2}${sRoutL3}${sRoutL4}`);
      },

      // 메뉴 도움말 자료실 Combo
      async helpMenuId(sWerks = this.getAppointeeProperty('Werks')) {
        const oModel = this.getModel(ServiceNames.COMMON);

        return await Client.getEntitySet(oModel, 'HelpInfoMenid', { Werks: sWerks });
      },

      // Tree선택시 상세내용조회
      async treeDetail(sL1id = '', sL2id = '', sL3id = '', sL4id = '', sWerks = '') {
        const oModel = this.getModel(ServiceNames.COMMON);
        const mAppointee = this.getAppointeeData();
        const mPayLoad = {
          Pernr: mAppointee.Pernr,
          Werks: mAppointee.Werks,
          Menid: this.getCurrentMenuId(),
          Prcty: 'D',
          HelpInfo2Nav: [
            {
              Werks: sWerks,
              L1id: sL1id,
              L2id: sL2id,
              L3id: sL3id,
              L4id: sL4id,
            },
          ],
        };

        return await Client.deep(oModel, 'HelpInfo', mPayLoad);
      },

      // oData Tree Setting
      oDataChangeTree(aList = []) {
        const oTree = this.byId('ReferenceTree');
        let tree1 = [];
        let tree2 = [];
        let tree3 = [];
        let tree4 = [];

        oTree.collapseAll();
        oTree.expandToLevel(1);
        const aTree2 = _.chain(aList)
          .map((o) => _.omit(o, '__metadata'))
          .map((e) => {
            if (e.L4id) {
              return { ...e, id: e.L4id, title: e.L4tx, use: e.L4use };
            } else if (e.L3id) {
              return { ...e, id: e.L3id, title: e.L3tx, use: e.L3use };
            } else if (e.L2id) {
              return { ...e, id: e.L2id, title: e.L2tx, use: e.L2use };
            } else if (e.L1id) {
              return { ...e, id: e.L1id, title: e.L1tx, use: e.L1use };
            }
          })
          .value();
        _.forEach(aTree2, (e) => {
          if (e.L4id) {
            tree4.push(e);
          }
          if (e.L3id && !e.L4id) {
            tree3.push(e);
          }
          if (e.L2id && !e.L3id) {
            tree2.push(e);
          }
          if (e.L1id && !e.L2id) {
            tree1.push(e);
          }
        });

        _.forEach(tree1, (e) => {
          e.child = _.filter(tree2, (e1) => {
            return e.L1id === e1.L1id;
          });
        });
        _.forEach(tree2, (e) => {
          if (e.L2id) {
            e.child = _.filter(tree3, (e1) => {
              return e.L2id === e1.L2id;
            });
          }
        });
        _.forEach(tree3, (e) => {
          if (e.L3id) {
            e.child = _.filter(tree4, (e1) => {
              return e.L3id === e1.L3id;
            });
          }
        });

        return tree1;
      },

      // override AttachFileCode
      getApprovalType() {
        return 'INFO';
      },

      // 관리자조회 Dialog 닫기클릭
      onClick(oEvent) {
        oEvent.getSource().getParent().close();
      },

      // 관리자조회
      onManagerBtn() {
        const oView = this.getView();

        setTimeout(() => {
          if (!this._pManagerDialog) {
            this._pManagerDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.referenceRoom.fragment.Manager',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          this._pManagerDialog.then(async function (oDialog) {
            oDialog.open();
          });
        }, 100);
      },

      // 관리자 조회
      async dialogManagerList(sL1id = '', sL2id = '', sL3id = '', sL4id = '', sWerks = '') {
        const oModel = this.getModel(ServiceNames.COMMON);
        const mAppointee = this.getAppointeeData();
        const mPayLoad = {
          Pernr: mAppointee.Pernr,
          Werks: mAppointee.Werks,
          Menid: this.getCurrentMenuId(),
          Prcty: 'A',
          HelpInfo3Nav: [
            {
              Werks: sWerks,
              L1id: sL1id,
              L2id: sL2id,
              L3id: sL3id,
              L4id: sL4id,
            },
          ],
        };

        return await Client.deep(oModel, 'HelpInfo', mPayLoad);
      },

      checkError() {
        const oDetailModel = this.getViewModel();
        const mFormData = oDetailModel.getProperty('/FormData');

        // 동호회
        if (mFormData.Zclub === 'ALL' || !mFormData.Zclub) {
          MessageBox.alert(this.getBundleText('MSG_14004'));
          return true;
        }

        return false;
      },

      // 저장
      async onSaveBtn() {
        // if (this.checkError()) {
        //   return;
        // }

        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          // 저장, 취소
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 저장
            if (!vPress || vPress !== this.getBundleText('LABEL_00103')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true, this);

              const oDetailModel = this.getViewModel();
              const sAppno = oDetailModel.getProperty('/FormData/Appno');

              if (!sAppno || _.parseInt(sAppno) === 0) {
                const sAppno = await Appno.get.call(this);

                oDetailModel.setProperty('/FormData/Appno', sAppno);
              }

              const oModel = this.getModel(ServiceNames.COMMON);
              const mAppointee = this.getAppointeeData();
              const mFormData = oDetailModel.getProperty('/FormData');
              let oSendObject = {
                Pernr: mAppointee.Pernr,
                Werks: mFormData.Werks,
                Menid: this.getCurrentMenuId(),
                Prcty: 'S',
                HelpInfo2Nav: [
                  {
                    ...mFormData,
                    Zcomment: mFormData.HeadZcomment,
                  },
                  {
                    ...mFormData,
                    Zcomment: mFormData.MidZcomment,
                  },
                  {
                    ...mFormData,
                    Zcomment: mFormData.BotZcomment,
                  },
                ],
                HelpInfo4Nav: [
                  {
                    Appno: mFormData.Appno,
                  },
                ],
              };

              debugger;
              // FileUpload
              await AttachFileAction.uploadFile.call(this, mFormData.Appno, this.getApprovalType());
              await Client.deep(oModel, 'HelpInfo', oSendObject);

              // {저장}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'));
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false, this);
            }
          },
        });
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/FormData/ZappStatAl');
        const sAppno = oViewModel.getProperty('/FormData/Appno') || '';

        AttachFileAction.setAttachFile(this, {
          Editable: !sStatus,
          Type: this.getApprovalType(),
          Appno: sAppno,
          Message: this.getBundleText('MSG_29003'),
          Max: 10,
          FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'txt', 'png'],
        });
      },
    });
  }
);
