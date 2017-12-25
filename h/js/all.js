const axios = require('axios');
const moment = require('moment');
const electron = require('electron');
const fs = electron.remote.require('fs');
const os = electron.remote.require('os');
const exec = electron.remote.require('child_process').exec;

const blocks = {};
const isFound = {
	nocoin: false,
	minerblock: false,
	aw: false,
};

const BACKUP_PATH = `${os.homedir()}\\AppData\\Local\\NoMiningHosts.backup`;
const ORIG_HOSTS_PATH = 'C:\\Windows\\System32\\drivers\\etc\\hosts';

$(() => {

	exec('NET SESSION', (err, so, se) => {
		if(se.length !== 0){
			alert('請使用系統管理員身分執行！', ' ');
			electron.remote.app.exit();
		}
	});

	const t = fs.existsSync(BACKUP_PATH) ? fs.statSync(BACKUP_PATH) : null;
	if(t){
		$('#backup .listDesc').text('上次備份時間：' + moment(t.mtime).format('YYYY-MM-DD HH:mm:ss'));
		$('#restore').removeClass('disabled');
	}

	let content = fs.readFileSync(ORIG_HOSTS_PATH, 'utf-8');
	Array.from(content.split('\r\n')).forEach(line => {
		if(line.includes(`NoMiningHosts nocoin`)) isFound['nocoin'] = true;
		if(line.includes(`NoMiningHosts minerblock`)) isFound['minerblock'] = true;
		if(line.includes(`NoMiningHosts aw`)) isFound['aw'] = true;
	});
	if(isFound.nocoin !== false || isFound.minerblock !== false || isFound.aw !== false){
		$('header').css('background', '#43A047');
		$('header .status').html('<i class="fas fa-check-circle"></i> 已受保護');
	}

	console.log('wait...');
	axios.get('https://raw.githubusercontent.com/keraf/NoCoin/master/src/blacklist.txt')
	.then(res => {
		blocks.nocoin = [];
		Array.from(res.data.split('\n')).forEach(line => {
			blocks.nocoin.push(line);
		});
		if(isFound['nocoin']) {
			$('#list-nocoin .listStatus').html('<i class="fas toggler fa-toggle-on"></i>');
		}else{
			$('#list-nocoin .listStatus').html('<i class="fas toggler fa-toggle-off"></i>');
		}
	});

	axios.get('https://raw.githubusercontent.com/xd4rker/MinerBlock/master/assets/filters.txt')
	.then(res => {
		blocks.minerblock = [];
		Array.from(res.data.split('\n')).forEach(line => {
			blocks.minerblock.push(line);
		});
		if(isFound['minerblock'] ){
			$('#list-minerblock .listStatus').html('<i class="fas toggler fa-toggle-on"></i>');
		}else{
			$('#list-minerblock .listStatus').html('<i class="fas toggler fa-toggle-off"></i>');
		}
	});

	axios.get('https://raw.githubusercontent.com/greatis/Anti-WebMiner/master/blacklist.txt')
	.then(res => {
		blocks.aw = [];
		Array.from(res.data.split('\n')).forEach(line => {
			blocks.aw.push(line);
		});
		if(isFound['aw']){
			$('#list-aw .listStatus').html('<i class="fas toggler fa-toggle-on"></i>');
		}else{
			$('#list-aw .listStatus').html('<i class="fas toggler fa-toggle-off"></i>');
		}
	});

	$('.listStatus').on('click', (e) => {
		// if($(this).find('svg').length){
			let name = $(e.currentTarget).data('name');
			let status = !isFound[name];
			modifyHosts(name, status);
		// }
	})

	$('#backup').on('click', () => {
		fs.createReadStream(ORIG_HOSTS_PATH)
		.pipe(fs.createWriteStream(BACKUP_PATH));
		alert('備份完成！', ' ');
		const t = fs.existsSync(BACKUP_PATH) ? fs.statSync(BACKUP_PATH) : null;
		if(t){
			$('#backup .listDesc').text('上次備份時間：' + moment(t.mtime).format('YYYY-MM-DD HH:mm:ss'));
			$('#restore').removeClass('disabled');
		}
	});

	$('#restore').on('click', () => {
		if(!$(this).hasClass('disabled')){
			fs.createReadStream(BACKUP_PATH)
			.pipe(fs.createWriteStream(ORIG_HOSTS_PATH));
			alert('還原完成！', ' ');
		}
	});
});

const modifyHosts = (name, toggle) => {
	if(toggle === true){
		let content = fs.readFileSync(ORIG_HOSTS_PATH, 'utf-8');
		let isFoundThis = false;
		Array.from(content.split('\n')).forEach(line => {
			if(line.includes(`NoMiningHosts ${name}`)) isFoundThis = true;
		});
		if(!isFoundThis && blocks[name].length > 0){
			Array.from(blocks.nocoin).forEach(line => {
				let domain = line.replace(/\*\:\/\//g, '');
				domain = domain.replace(/wss\:\/\//g, '');
				domain = domain.replace(/\*\./g, '');
				domain = domain.replace(/\*/g, '');
				domain = domain.replace(/ws:\/\//g, '');
				domain = domain.replace(/\[/g, '#');
				domain = domain.replace(/Version=/g, '#Version=');
				domain = domain.split('/')[0];
				content += `127.0.0.1\t${domain}\t# NoMiningHosts ${name}\r\n`;
			});
			// content = content.slice(0, -2);
			fs.writeFileSync(ORIG_HOSTS_PATH, content, 'utf-8');
		}
		isFound[name] = true;
		$('#list-'+name+' .listStatus').html('<i class="fas toggler fa-toggle-on"></i>');
	}else{
		let content = fs.readFileSync(ORIG_HOSTS_PATH, 'utf-8');
		let newContent = '';
		Array.from(content.split('\r\n')).forEach(line => {
			if(!line.includes(`NoMiningHosts ${name}`)) newContent += `${line.trim()}\r\n`;
		});
		newContent = newContent.slice(0, -2);
		fs.writeFileSync(ORIG_HOSTS_PATH, newContent, 'utf-8');
		isFound[name] = false;
		$('#list-'+name+' .listStatus').html('<i class="fas toggler fa-toggle-off"></i>');
	}
	if(isFound.nocoin !== false || isFound.minerblock !== false || isFound.aw !== false){
		$('header').css('background', '#43A047');
		$('header .status').html('<i class="fas fa-check-circle"></i> 已受保護');
	}else{
		$('header').css('background', '#F44336');
		$('header .status').html('<i class="fas fa-exclamation-triangle"></i> 需要防護');
	}
}