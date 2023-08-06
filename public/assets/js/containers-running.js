const socket = io();

socket.on('updatedRunOutput', function(containerRun) {
  if (!containerRun || containerRun.trim() === '') {
    const table = document.querySelector('#container-table tbody');
    table.innerHTML = `
      <tr>
        <td colspan="6">No containers are currently running</td>
      </tr>
    `;
  } else {
    const containers = containerRun.trim().split('\n').map(line => {
      const [id, image, status, ports, name] = line.split('\t');
      return { id, image, status, ports, name };
    });
  
    const table = document.querySelector('#container-table tbody');
    table.innerHTML = '';
    containers.forEach(container => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${container.id}</td>
        <td>${container.image}</td>
        <td>${container.status}</td>
        <td>${container.ports}</td>
        <td>${container.name}</td>
        <td>
          <div id="stopContainerForm">
            <input type="hidden" name="containerId" value="${container.id}">
            [ <button style="color:#27f6a4; border:0px; font-size: 16px; background-color: transparent;" type="button" onclick="stopContainer()">Stop</button> ]
          </div>
        </td>
        <!-- <a href="/">STOP</a>] - [<a href="/">LOGS</a>]</td> -->
      `;
      table.appendChild(row);
    });
  }  
});
