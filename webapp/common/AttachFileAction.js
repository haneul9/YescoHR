/* eslint-disable quote-props */
sap.ui.define(
    [
      'sap/ui/yesco/common/odata/ServiceManager',
      'sap/ui/yesco/common/odata/ServiceNames',
      'sap/ui/yesco/control/MessageBox',
    ],
    (
        ServiceManager,
	ServiceNames,
	MessageBox,
    ) => {
        'use strict';

        return {
            /*
            * 파일첨부 panel 및 FileUploader Control의 표시여부 등을 설정
            * 문서상태 및 첨부파일 여부에 따라 Control의 표시여부를 결정한다.
            */
            setAttachFile(oController, opt) {
                const options = $.extend(
                        true,
                        { 
                            Appno: '',
                            Type: '',
                            Editable: false,
                            Gubun: false,
                            FileTypes: [],
                            Mode: 'S',	// S: single file, M: multi file
                            Max: 3,
                            Message: '',
                            maximumFileSize: 10,
                        },
                        opt
                    );
                const oFileUploader = oController.byId("ATTACHFILE_BTN");

                oFileUploader.setValue("");

                options.ListMode = options.Editable ? sap.ui.table.SelectionMode.MultiToggle : sap.ui.table.SelectionMode.None;
                options.FileTypes = !!opt.FileTypes ? opt.FileTypes : ["ppt", "pptx", "doc", "docx", "xls", "xlsx", "jpg", "bmp", "gif", "png", "txt", "pdf", "jpeg"];

                oController.getViewModel().setProperty("/Settings", options);
                oController.getViewModel().setProperty("/DelelteDatas", []);

                oController.AttachFileAction.refreshAttachFileList(oController);
            },
            /*
            * 첨부파일의 Upload가 완료되었을때 처리 내역
            * refreshAttachFileList Function을 호출한다.
            */
            uploadComplete(oEvent) {
                const sResponse = oEvent.getParameter("response");

                MessageBox.alert(sResponse);
            },

            /*
            * Upload할 첨부파일을 선택했을 경우 처리 내역
            */
            onFileChange(oEvent) {
                const oAttachbox = this.byId("ATTACHBOX");
                const oFileUploader = this.byId("ATTACHFILE_BTN");
                const JSonModel = oAttachbox.getModel();
                const aFileList = [];
                const vMode = JSonModel.getProperty("/Settings/Mode");
                const vMax = JSonModel.getProperty("/Settings/Max");
                const files = oEvent.getParameters().files;
                let vFileData = JSonModel.getProperty("/Data");

                // File 데이터 초기화
                if(!vFileData) {
                    JSonModel.setProperty("/Data", []);
                    vFileData = JSonModel.getProperty("/Data");
                }

                if (!!files) {
                    vFileData.forEach((elem) => {
                        aFileList.push(elem);
                    });

                    if(vMode === "M" && (vFileData.length + files.length) > vMax) {
                        oFileUploader.clear();
                        oFileUploader.setValue("");

                        MessageBox.alert(this.getBundleText("MSG_00014", vMax));

                        return;
                    }

                    const iFileLeng = aFileList.length + files.length;

                    for (let i = 0; i < files.length; i++) {
                        files[i].New = true;
                        files[i].Zfilename = files[i].name;
                        files[i].Type = files[i].type;
                        files[i].Zbinkey = String(parseInt(Math.random() * 100000000000000));
                        files[i].Seqnr = aFileList.length + 1;

                        aFileList.push(files[i]);
                    }

                    JSonModel.setProperty("/Settings/Length", iFileLeng);
                    JSonModel.setProperty("/Data", aFileList);

                    this.byId("attachTable").clearSelection();
                    this.byId("attachTable").setVisibleRowCount(iFileLeng);
                }

                oFileUploader.clear();
                oFileUploader.setValue("");
            },

            /*
            * 첨부파일 링크 Click
            */
            onFileLink(oEvent) {
                var vFileInfo = oEvent.getSource().getBindingContext().getProperty();

                if(!vFileInfo) return;

                window.open(vFileInfo.Fileuri, '_blank');
            },

            /*
            * 첨부파일 리스트를 Binding한다.
            */
            refreshAttachFileList(oController) {
                const oAttachbox = oController.byId("ATTACHBOX");
                const oAttachFileList = oController.byId("attachTable");
                const oFileUploader = oController.byId("ATTACHFILE_BTN");
                const oModel = oController.getModel(ServiceNames.COMMON);
                const JSonModel = oController.getViewModel();
                const vAttachFileDatas = JSonModel.getProperty("/Settings");
                const Datas = { Data: [] };

                JSonModel.setProperty("/Data", []);
                oAttachbox.setBusyIndicatorDelay(0).setBusy(true);
                oFileUploader.clear();
                oFileUploader.setValue("");

                oModel.read("/FileListSet", {
                    filters: [
                        new sap.ui.model.Filter("Appno", sap.ui.model.FilterOperator.EQ, vAttachFileDatas.Appno),
                        new sap.ui.model.Filter("Zworktyp", sap.ui.model.FilterOperator.EQ, vAttachFileDatas.Type)
                    ],
                    success: (data) => {
                        if (data && data.results.length) {
                            data.results.forEach((elem) => {
                                elem.New = false;
                                Datas.Data.push(elem);
                            });
                        }

                        JSonModel.setProperty("/Settings/Length", Datas.Data.length);
                        JSonModel.setProperty("/Data", Datas.Data);
                        oAttachFileList.setVisibleRowCount(Datas.Data.length);
                        oAttachbox.setBusy(false);
                    },
                    error: (res) => {
                        this.debug(`${sUrl} error.`, res);
                        oAttachbox.setBusy(false);
                    }
                })
            },
            /*
            * 조회화면 list에있는 증빙클릭시 첨부파일리스트 호출
            */
            setTableFileList(oController, oTableRowData = {}) {
                const oListFileTable = oController.byId("listFileTable");
                const oModel = oController.getModel(ServiceNames.COMMON);
                const JSonModel = oController.getViewModel();
                const Datas = { Data: [] };


                oModel.read("/FileListSet", {
                    async: false,
                    filters: [
                        new sap.ui.model.Filter("Appno", sap.ui.model.FilterOperator.EQ, oTableRowData.Appno),
                        new sap.ui.model.Filter("Zworktyp", sap.ui.model.FilterOperator.EQ, oController.TYPE_CODE)
                    ],
                    success: (data) => {
                        if (data && data.results.length) {
                            data.results.forEach((elem) => {
                                elem.New = false;
                                Datas.Data.push(elem);
                            });
                        }

                        JSonModel.setProperty("/Data", Datas.Data);
                        JSonModel.setProperty("/Data/busy", false);
                        oListFileTable.setVisibleRowCount(Datas.Data.length);
                    },
                    error: (res) => {
                        this.debug(`${sUrl} error.`, res);
                        JSonModel.setProperty("/Data/busy", false);
                    }
                })
            },

            /*
            * 첨부파일 길이
            */
            getFileLength() {
                const Attachbox = this.byId("ATTACHBOX");
                const vAttachDatas = Attachbox.getModel().getProperty("/Data");
        
                return !!vAttachDatas ? vAttachDatas.length : 0;
            },

            /*
            *   첨부파일 Upload
            */
            uploadFile(Appno, Type) {
                const sServiceUrl = ServiceManager.getServiceUrl('ZHR_COMMON_SRV', this.getOwnerComponent());
                const oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true, undefined, undefined, undefined, undefined, undefined, false);
                const Attachbox = this.byId("ATTACHBOX");
                const vAttachDatas = Attachbox.getModel().getProperty("/Data") || [];
                const aDeleteFiles = Attachbox.getModel().getProperty("/DelelteDatas") || [];
                const oAttachTable = this.byId("attachTable");
        
                return new Promise((resolve) => {        
                    // 파일 삭제
                    if(!!aDeleteFiles.length) {
                        let bDeleteFlag = true;
    
                        Promise.all([
                            aDeleteFiles.forEach(e => {
                                bDeleteFlag= new Promise(resolve => {
                                    this.AttachFileAction.callDeleteFileService(this, e);
                                    this.byId("attachTable").clearSelection();
                                    resolve(bDeleteFlag);
                                });
                            })
                        ]).then(bFileSucces => {
                            if(!bFileSucces) {
                                MessageBox.alert(this.getBundleText('MSG_00040'));
                                return;
                            }
                        });
                    }
        
                    // 신규 등록된 파일만 업로드
                    if (vAttachDatas.every(e => !e.New)) return resolve();
        
                    vAttachDatas.forEach((elem) => {
                        if(elem.New === true) {
                            oModel.refreshSecurityToken();
                            const oRequest = oModel._createRequest();
                            const oHeaders = {
                                "x-csrf-token": oRequest.headers["x-csrf-token"],
                                "slug": [Appno, Type, encodeURI(elem.Zfilename)].join("|")
                            };
                                        
                            jQuery.ajax({
                                type: "POST",
                                async: false,
                                url: sServiceUrl + "/FileUploadSet/",
                                headers: oHeaders,
                                cache: false,
                                contentType: elem.type,
                                processData: false,
                                data: elem,
                                success: (data) => {
                                    this.debug(`${this.getBundleText('MSG_00016')}, ${data}`);
                                    resolve();
                                },
                                error: (data) => {
                                    const errorMsg = this.getBundleText('MSG_00040');

                                    this.debug(`Error: ${data}`);
                                    resolve(errorMsg);
                                },
                                complete: () => {
                                    oAttachTable.clearSelection();
                                }
                            });
                        }
                    });
                });
            },

            /*
            * 첨부된 파일을 삭제처리
            */
            onDeleteAttachFile() {
                const oAttachbox = this.byId("ATTACHBOX");
                const oJSonModel = oAttachbox.getModel();
                const oTable = this.byId("attachTable");
                const aFileDatas = oJSonModel.getProperty("/Data");
                const aContexts = oTable.getSelectedIndices();

                if (!aContexts.length) {
                    MessageBox.alert(this.getBundleText('MSG_00018')); // 삭제할 파일을 선택하세요.
                    return;
                }

                MessageBox.confirm(this.getBundleText('MSG_00019'), {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: (fVal) => {
                        if(fVal === MessageBox.Action.YES) {   
                            const aSelectFiles = [];
                            const aDeleteList = [];
    
                            aContexts.forEach(e => {
                                const oFileData = aFileDatas[e];

                                if(!!oFileData.Appno) {
                                    aDeleteList.push(oFileData);
                                }
                                aSelectFiles.push(oFileData);
                            });
    
                            const aResult = aFileDatas.filter(e => {
                                return !aSelectFiles.includes(e);
                            });
    
                            const iFileLeng = aResult.length;
    
                            for (let i = 0; i < iFileLeng; i++) {
                                if(!!aResult.length) {
                                    aResult[i].Seqnr = i + 1;
                                }    
                            }
    
                            oJSonModel.setProperty("/Data", aResult);
                            oJSonModel.setProperty("/DelelteDatas", aDeleteList);
                            oTable.setVisibleRowCount(aResult.length);
                            this.byId("attachTable").clearSelection()
                            MessageBox.alert(this.getBundleText('MSG_00041')); // 파일 삭제가 완료되었습니다.
                        }
                    }
                });
            },

            /*
            * 첨부파일 삭제 oData
            */
            callDeleteFileService(oController, fileInfo) {
                const oModel = oController.getModel(ServiceNames.COMMON);
                const sPath = oModel.createKey("/FileListSet", {
                    Appno: fileInfo.Appno,
                    Zworktyp: fileInfo.Zworktyp,
                    Zfileseq: fileInfo.Zfileseq,
                });
        
                oModel.remove(sPath, {
                    success: () => {
                        return true;
                    },
                    error: () => {
                        return false;
                    }
                });
            },
        }
    }
);