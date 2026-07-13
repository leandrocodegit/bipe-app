import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'route-base',
  imports: [
    RouterModule
  ],
  template: `
<div>
  <router-outlet />
</div>
`,
})
export class PainelRouteBaseComponent {

}
