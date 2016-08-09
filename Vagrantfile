# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "debian/jessie64"
  # config.vm.box_check_update = false
  config.vm.network "forwarded_port", guest: 9000, host: 9000
  config.vm.network "private_network", ip: "10.0.0.1"
  # config.vm.network "public_network"
  # config.vm.synced_folder "../data", "/vagrant_data"
  config.vm.provider "virtualbox" do |vb|
     vb.memory = "512"
  end
  config.vm.synced_folder ".", "/usr/local/site/socex"
  config.vm.provision "shell", path: "vagrant.sh"
end
