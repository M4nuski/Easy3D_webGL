
class ressource {
    constructor(path, name, type, cb) {
        this.path = path;
        this.name = name;
        this.type = type;
        this.cb = cb; // (ressourceName, message)

        this.ajax = null;
        this.data = null;
        this.new = true;
    }

    load(){
        this.ajax = new XMLHttpRequest();
        this.ajax.addEventListener("load", (e) => this.onLoad(e) );    
        this.ajax.open("GET", this.path);
        this.ajax.send();
    }

    onLoad(event) {
        let xm = event.target;
        if (xm) {
            if (xm.status == 200) {
                this.data = xm.responseText;
                this.cb(this.name, E3D_RES_LOAD);
            } else {
                this.data = null;
                console.log(xm.responseURL  + " " + xm.statusText);
                this.cb(this.name, E3D_RES_FAIL);
            }
        }
        this.ajax = null;
        this.new = false;
    }
}

class ressourceManager {
    constructor (callBack) {
        this.callBack = callBack; // (ressourceName, message)
        this.ressList = [];
        this.numLoaded = 0;
        this.tag = "";
    }

    addRessource(path, name, type) {
        if (this.getIndex(name) == -1) {
            this.ressList.push( new ressource(path, name, type, (n, m) => this.cb(n, m)) );
        } else {
            this.cb(name, E3D_RES_LOAD, true); // return already if ressource in store
        }
    }

    loadNull(tag){
        this.numLoaded = 0;
        this.tag = tag;
        for (let i = 0; i < this.ressList.length; ++i) {
            if (this.ressList[i].data == null) {
                this.ressList[i].load();
            } else {
                this.numLoaded++;
            }
        }
        if (this.numLoaded == this.ressList.length) {
            if (this.callBack) {
                this.callBack(tag, E3D_RES_ALL);
            }
        }
    }

    loadAll(tag){
        this.tag = tag;
        this.numLoaded = 0;
        for (let i = 0; i < this.ressList.length; ++i) {
            this.ressList[i].load();
        }
    }

    loadNew(tag) {
        this.tag = tag;
        this.numLoaded = 0;
        for (let i = 0; i < this.ressList.length; ++i) {
            if (this.ressList[i].new) {
                this.ressList[i].load();
            } else {
                this.numLoaded++;
            }
        } 
        if (this.numLoaded == this.ressList.length) {
            if (this.callBack) {
                this.callBack(tag, E3D_RES_ALL);
            }
        }
    }

    cb(n, m, inhibitCount = false) {
        if (m == E3D_RES_LOAD) {
            if (this.callBack) {
                if (!inhibitCount) this.numLoaded++;
                this.callBack(n, E3D_RES_LOAD);
            }
        }
        if (m == E3D_RES_FAIL) {
            if (this.callBack) {
                this.callBack(n, E3D_RES_FAIL);
            }
        }

        if (this.numLoaded == this.ressList.length) {
            if (this.callBack) {
                this.callBack(this.tag, E3D_RES_ALL);
            }
        }
    }

    getData(name) {
        let idx = this.getIndex(name);
        if (idx > -1) {
            return this.ressList[idx].data;
        } else return null;
    }

    getRessourcePath(name) {
        let idx = this.getIndex(name);
        if (idx > -1) {
            return this.ressList[idx].path;
        } else return "";
    }

    getRessourceType(name) {
        let idx = this.getIndex(name);
        if (idx > -1) {
            return this.ressList[idx].type;
        } else return "";
    }

    getIndex(name) {
        for (let i = 0; i < this.ressList.length; ++i) {
            if (this.ressList[i].name == name) return i;
        }
        return -1;
    }

    flushAll(){
        for (let i = this.ressList.length -1 ; i >=0; --i) {
            this.ressList.splice(i);
        }
    }

    flushType(type) {
        for (let i = this.ressList.length -1 ; i >=0; --i) {
            if (this.ressList[i].type == type) this.ressList.splice(i);
        }
    }

}